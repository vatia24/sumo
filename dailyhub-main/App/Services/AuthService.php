<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Helpers\JwtHelper;
use App\Models\AuthModel;
use Exception;
use League\OAuth2\Client\Provider\Facebook;
use League\OAuth2\Client\Provider\Google;
use Twilio\Rest\Client;

class AuthService
{
    private AuthModel $authModel;

    private mixed $authConfig;
    private mixed $facebookConfig;
    private mixed $googleConfig;

    public function __construct(AuthModel $authModel, $authConfig)
    {
        $this->authModel = $authModel;
        $this->authConfig = $authConfig;
        $this->facebookConfig = $authConfig['facebook'];
        $this->googleConfig = $authConfig['google'];
    }

    /**
     * @throws Exception
     */
    public function handleFacebookAuth($accessToken): array
    {
        $provider = new Facebook([
            'clientId' => $this->facebookConfig['client_id'],
            'clientSecret' => $this->facebookConfig['client_secret'],
            'redirectUri' => $this->facebookConfig['redirect_uri'],
        ]);

        try {
            // Get the Facebook user details
            $facebookUser = $provider->getResourceOwner($provider->getAccessToken('authorization_code', [
                'code' => $accessToken,
            ]));

            // Extract relevant user details defensively
            $raw = method_exists($facebookUser, 'toArray') ? (array)$facebookUser->toArray() : [];
            $userData = [
                'id' => method_exists($facebookUser, 'getId') ? $facebookUser->getId() : ($raw['id'] ?? null),
                'email' => $raw['email'] ?? null,
                'name' => $raw['name'] ?? ($raw['first_name'] ?? null),
            ];

            // Generate JWT token
            return [
                'token' => JwtHelper::generateToken($userData),
                'user' => $userData,
            ];
        } catch (Exception $e) {
            throw new Exception('Facebook login failed: ' . $e->getMessage());
        }
    }

    public function handleGoogleAuth($accessToken): array
    {
        $provider = new Google([
            'clientId' => $this->googleConfig['client_id'],
            'clientSecret' => $this->googleConfig['client_secret'],
            'redirectUri' => $this->googleConfig['redirect_uri'],
        ]);

        try {
            // Get the Google user details
            $googleUser = $provider->getResourceOwner($provider->getAccessToken('authorization_code', [
                'code' => $accessToken,
            ]));

            $raw = method_exists($googleUser, 'toArray') ? (array)$googleUser->toArray() : [];
            $userData = [
                'id' => method_exists($googleUser, 'getId') ? $googleUser->getId() : ($raw['id'] ?? null),
                'email' => $raw['email'] ?? null,
                'name' => $raw['name'] ?? ($raw['given_name'] ?? null),
            ];

            // Generate JWT token
            return [
                'token' => JwtHelper::generateToken($userData),
                'user' => $userData,
            ];
        } catch (Exception $e) {
            throw new Exception('Google login failed: ' . $e->getMessage());
        }
    }

    /**
     * @throws ApiException
     */
    public function sendOtp(string $mobile): void
    {
        if (empty($mobile)) {
            throw new ApiException(400, 'BAD_REQUEST', 'Mobile number is required to send OTP');
        }

        $sid = $_ENV['TWILIO_SID'] ?? '';
        $token = $_ENV['TWILIO_AUTH_TOKEN'] ?? '';
        $ver_sid = $_ENV['TWILIO_VERIFY_SID'] ?? '';
        if ($sid === '' || $token === '' || $ver_sid === '') {
            throw new ApiException(500, 'SERVER_CONFIG_ERROR', 'Twilio configuration missing');
        }

        try {

            $twilio = new Client($sid, $token);

            // Generate a random 6-digit OTP
            $otp = random_int(100000, 999999);
            // Store OTP in database (pseudo implementation)
            $this->authModel->storeOtp($mobile, $otp);

            $twilio->verify->v2->services($ver_sid)
                ->verifications
                ->create($mobile, "sms", ["customCode" => $otp]);

        } catch (Exception $e) {
            throw new ApiException(500, 'OTP_SEND_FAILED', 'Failed to send OTP: ' . $e->getMessage());
        }
    }

    /**
     * @throws ApiException
     */
    public function checkOtp(string $mobile, int $otp): bool
    {
        if (empty($mobile) || empty($otp)) {
            throw new ApiException(400, 'BAD_REQUEST', 'Mobile number and OTP are required for verification');
        }

        // Verify OTP from database (pseudo implementation)
        $isValid = $this->authModel->verifyOtp($mobile, $otp);

        if (!$isValid) {
            throw new ApiException(400, 'INVALID_OTP', 'The provided OTP is invalid or has expired');
        }

        return true;
    }

    /**
     * Verify OTP and activate user account
     *
     * @throws ApiException
     */
    public function verifyAndActivateUser(array $data): bool
    {
        // Verify the OTP
        if ($this->checkOtp($data['mobile'], $data['otp'])) {
            try {
                // Activate the user status
                $this->authModel->activateUser($data['mobile']);
                return true;
            } catch (Exception $e) {
                throw new ApiException(500, 'ACTIVATION_FAILED', 'Failed to activate user account: ' . $e->getMessage());
            }
        }
        return false;
    }

    /**
     * @throws ApiException
     */
    public function authorize($data): array
    {
        $identifier = $data['identifier'];
        // Throttle attempts
        $this->authModel->checkAndIncrementLoginAttempts($identifier);
        $user = $this->authModel->findUserByMailOrNumber($identifier);

        if (!$user || !password_verify($data['password'], $user['password'])) {
            throw new ApiException(401,'INVALID_CREDENTIALS', 'Invalid credentials');
        } elseif ($user['status'] == 'unverified') {
            //send otp code to activate user
        }

        // Generate JWT Token
        $token = JwtHelper::generateToken(['id' => $user['id'], 'identifier' => $identifier, 'role' => $user['user_type']]);

        $this->authModel->storeAccessToken(
            $user['id'],
            $token,
            (int) $this->authConfig['jwt_expiration']
        );

        // Issue refresh token (opaque, random)
        $refreshTtl = (int)($this->authConfig['refresh_expiration'] ?? 1209600);
        $refresh = bin2hex(random_bytes(32));
        $this->authModel->storeRefreshToken((int)$user['id'], $refresh, $refreshTtl);
        // Reset attempts on success
        $this->authModel->resetLoginAttempts($identifier);
        return ['token' => $token, 'refresh_token' => $refresh, 'expires_in' => (int)$this->authConfig['jwt_expiration']];
    }

    /**
     * Exchange refresh token for new access token (and rotate refresh)
     */
    public function refresh(array $data): array
    {
        if (empty($data['refresh_token'])) {
            throw new ApiException(400, 'BAD_REQUEST', 'refresh_token required');
        }
        $row = $this->authModel->findValidRefreshToken($data['refresh_token']);
        if (!$row) {
            throw new ApiException(401, 'INVALID_TOKEN', 'Invalid refresh token');
        }
        $userId = (int)$row['user_id'];
        // Find minimal user payload
        $pdo = \Config\Db::getInstance();
        $stmt = $pdo->prepare('SELECT id, email, mobile, user_type FROM users WHERE id = :id');
        $stmt->bindParam(':id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if (!$user) {
            throw new ApiException(404, 'NOT_FOUND', 'User not found');
        }
        $identifier = $user['email'] ?: $user['mobile'];
        $access = JwtHelper::generateToken(['id' => $userId, 'identifier' => $identifier, 'role' => $user['user_type']]);
        $this->authModel->storeAccessToken($userId, $access, (int)$this->authConfig['jwt_expiration']);
        // Rotate refresh token
        $newRefresh = bin2hex(random_bytes(32));
        $this->authModel->storeRefreshToken($userId, $newRefresh, (int)$this->authConfig['refresh_expiration']);
        $this->authModel->revokeRefreshToken($data['refresh_token'], $newRefresh);
        return ['token' => $access, 'refresh_token' => $newRefresh, 'expires_in' => (int)$this->authConfig['jwt_expiration']];
    }

    /**
     * @throws ApiException
     */
    public function authorizeRequest(): \stdClass
    {
        $headers = getallheaders(); // Get request headers
        $authHeader = $headers['Authorization'] ?? null;

        if (!$authHeader) {
            throw new ApiException(401, 'UNAUTHORIZED', 'Authorization header not found');
        }

        $token = str_replace('Bearer ', '', $authHeader); // Extract the token
        $decodedToken = JwtHelper::validateToken($token);

        if (!$decodedToken) {
            throw new ApiException(401, 'INVALID_TOKEN', 'Invalid or expired token');
        }

        // Enforce server-side token presence (logout/revocation aware)
        if (!$this->authModel->tokenExists($token)) {
            throw new ApiException(401, 'INVALID_TOKEN', 'Token revoked or expired');
        }

        return $decodedToken; // Return the token if valid
    }

    /**
     * Invalidate JWT by storing/removing token (depending on blacklist strategy)
     */
    public function logout(): void
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? null;
        if (!$authHeader) return;
        $token = str_replace('Bearer ', '', $authHeader);
        // Option A: Delete from access_tokens (server-side sessions)
        // Note: Implement a small model layer if needed; using PDO inline for brevity
        $pdo = \Config\Db::getInstance();
        $stmt = $pdo->prepare('DELETE FROM access_tokens WHERE token = :token');
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        $stmt->closeCursor();
    }

    /**
     * Issue a password reset code and store temporarily
     */
    public function requestPasswordReset(array $data): array
    {
        if (empty($data['identifier'])) throw new ApiException(400, 'BAD_REQUEST', 'Identifier required');
        $user = $this->authModel->findUserByMailOrNumber($data['identifier']);
        if (!$user) throw new ApiException(404, 'NOT_FOUND', 'User not found');
        $code = random_int(100000, 999999);
        // Reuse otp_codes table as reset storage
        $pdo = \Config\Db::getInstance();
        $stmt = $pdo->prepare('INSERT INTO otp_codes (mobile, otp, created_at, is_used) VALUES (:mobile, :otp, NOW(), 0)');
        $identifier = $data['identifier'];
        $stmt->bindParam(':mobile', $identifier);
        $stmt->bindParam(':otp', $code);
        $stmt->execute();
        $stmt->closeCursor();
        // Send via SMS or email provider in real life
        return ['reset_sent' => true];
    }

    /**
     * Confirm reset code and set new password
     */
    public function confirmPasswordReset(array $data): array
    {
        if (empty($data['identifier']) || empty($data['otp']) || empty($data['new_password'])) {
            throw new ApiException(400, 'BAD_REQUEST', 'Missing fields');
        }
        // validate code from otp_codes
        $pdo = \Config\Db::getInstance();
        $stmt = $pdo->prepare('SELECT id FROM otp_codes WHERE (mobile = :identifier) AND otp = :otp AND created_at >= NOW() - INTERVAL 10 MINUTE AND is_used = 0 ORDER BY created_at DESC LIMIT 1');
        $stmt->bindParam(':identifier', $data['identifier']);
        $stmt->bindParam(':otp', $data['otp']);
        $stmt->execute();
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if (!$row) throw new ApiException(400, 'INVALID_OTP', 'Invalid or expired code');

        // set new password
        $options = ['memory_cost' => 1 << 16, 'time_cost' => 4, 'threads' => 2];
        $hash = password_hash($data['new_password'], PASSWORD_ARGON2ID, $options);
        $stmt = $pdo->prepare('UPDATE users SET password = :pwd WHERE email = :identifier OR mobile = :identifier');
        $stmt->bindParam(':pwd', $hash);
        $stmt->bindParam(':identifier', $data['identifier']);
        $stmt->execute();
        $stmt->closeCursor();

        // mark OTP used
        $stmt = $pdo->prepare('UPDATE otp_codes SET is_used = 1 WHERE id = :id');
        $stmt->bindParam(':id', $row['id']);
        $stmt->execute();
        $stmt->closeCursor();

        // Revoke all refresh tokens for this user (logout all devices)
        // Find user id
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :identifier OR mobile = :identifier');
        $stmt->bindParam(':identifier', $data['identifier']);
        $stmt->execute();
        $userRow = $stmt->fetch(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if ($userRow) {
            // Best effort: mark all refresh tokens revoked
            $this->authModel->revokeRefreshToken('%', null); // placeholder
            // Since revoke by '%' is not implemented, bulk update via PDO
            $pdo->exec('CREATE TABLE IF NOT EXISTS refresh_tokens (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, token VARCHAR(255) NOT NULL UNIQUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NOT NULL, revoked TINYINT(1) NOT NULL DEFAULT 0, replaced_by VARCHAR(255) DEFAULT NULL, INDEX idx_rt_user (user_id), INDEX idx_rt_expires (expires_at))');
            $stmt = $pdo->prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = :uid');
            $stmt->bindParam(':uid', $userRow['id'], \PDO::PARAM_INT);
            $stmt->execute();
            $stmt->closeCursor();
        }

        return ['reset' => true];
    }

    /**
     * @throws ApiException
     */
    public function facebookAuth(): array
    {
        $accessToken = $_GET['code']; // Get 'code' from Facebook OAuth redirect
        try {
            $result = $this->handleFacebookAuth($accessToken);
            return $result;
        } catch (\Exception $e) {
            throw new ApiException(401, 'CANNOT_AUTHORIZE', $e->getMessage());
        }
    }

    /**
     * @throws ApiException
     */
    public function googleAuth(): array
    {
        $accessToken = $_GET['code']; // Get 'code' from Google OAuth redirect
        try {
            $result = $this->handleGoogleAuth($accessToken);
            return $result;
        } catch (\Exception $e) {
            throw new ApiException(401, 'CANNOT_AUTHORIZE', $e->getMessage());
        }
    }
}