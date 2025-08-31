<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Helpers\JwtHelper;
use App\Helpers\ResponseHelper;
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

            // Extract relevant user details
            $userData = [
                'id' => $facebookUser->getId(),
                'email' => $facebookUser->getEmail(),
                'name' => $facebookUser->getName(),
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

            // Extract relevant user details
            $userData = [
                'id' => $googleUser->getId(),
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
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

        $sid    = $_ENV['TWILIO_SID'];
        $token  = $_ENV['TWILIO_AUTH_TOKEN'];
        $ver_sid  = 'VA2f94da819aa97e3af62374593d5334c6';

        try {

            $twilio = new Client($sid, $token);

            // Generate a random 6-digit OTP
            $otp = random_int(100000, 999999);
            // Store OTP in database (pseudo implementation)
            $this->authModel->storeOtp($mobile, $otp);

            $twilio->verify->v2->services("$ver_sid")
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
        $user = $this->authModel->findUserByMailOrNumber($data['identifier']);

        if (!$user || !password_verify($data['password'], $user['password'])) {
            throw new ApiException(401,'INVALID_CREDENTIALS', 'Invalid credentials');
        } elseif ($user['status'] == 'unverified') {
            //send otp code to activate user
        }

        // Generate JWT Token
        $token = JwtHelper::generateToken(['id' => $user['id'], 'identifier' => $data['identifier'], 'role' => $user['user_type']]);

        $this->authModel->storeAccessToken(
            $user['id'],
            $token,
            (int) $this->authConfig['jwt_expiration']
        );

        return [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'identifier' => $user['identifier'] ?? $user['email'] ?? $user['mobile'],
                'role' => $user['user_type']
            ]
        ];
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

        return ['reset' => true];
    }

    /**
     * @throws ApiException
     */
    public function facebookAuth(): void
    {
        $accessToken = $_GET['code']; // Get 'code' from Facebook OAuth redirect
        try {
            $result = $this->handleFacebookAuth($accessToken);
            ResponseHelper::response(200, 'SUCCESS', $result);
        } catch (\Exception $e) {
            throw new ApiException(401, 'CANNOT_AUTHORIZE', $e->getMessage());
        }
    }

    /**
     * @throws ApiException
     */
    public function googleAuth(): void
    {
        $accessToken = $_GET['code']; // Get 'code' from Google OAuth redirect
        try {
            $result = $this->handleGoogleAuth($accessToken);
            ResponseHelper::response(200, 'SUCCESS', $result);
        } catch (\Exception $e) {
            throw new ApiException(401, 'CANNOT_AUTHORIZE', $e->getMessage());
        }
    }
}