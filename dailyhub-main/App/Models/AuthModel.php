<?php

namespace App\Models;

use Config\Db;
use PDO;

class AuthModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance(); // Assumes Db::getInstance() initializes the PDO connection
    }
    public function storeOtp(string $mobile, int $otp): void
    {
        $query = 'INSERT INTO otp_codes (mobile, otp) VALUES (:mobile, :otp)';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->bindParam(':otp', $otp);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function verifyOtp(string $mobile, int $otp): bool
    {
        $query = 'SELECT id, otp FROM otp_codes WHERE mobile = :mobile AND created_at >= NOW() - INTERVAL 2 MINUTE AND is_used = 0 ORDER BY created_at DESC LIMIT 1';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->execute();

        $lastOtp = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if (!$lastOtp || $lastOtp['otp'] !== (string)$otp) return false;

        $updateQuery = 'UPDATE otp_codes SET is_used = 1 WHERE id = :id';
        $updateStmt = $this->db->prepare($updateQuery);
        $updateStmt->bindParam(':id', $lastOtp['id']);
        $updateStmt->execute();
        $updateStmt->closeCursor();

        return true;
    }

    public function activateUser(string $mobile): void
    {
        $query = 'UPDATE users SET status = \'active\' WHERE mobile = :mobile';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function findUserByMailOrNumber($identifier)
    {
        $query = 'SELECT * FROM users WHERE email = :email OR mobile = :mobile LIMIT 1';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $identifier);
        $stmt->bindParam(':mobile', $identifier);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        return $result;
    }

    public function storeAccessToken($user_id, $token, $expires_in_seconds): void
    {
        // Compute expiry from DB server time to avoid app/DB timezone drift
        $query = 'INSERT INTO access_tokens (user_id, token, created_at, expires_at) VALUES (:user_id, :token, NOW(), DATE_ADD(NOW(), INTERVAL :expires_seconds SECOND))';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires_seconds', $expires_in_seconds, PDO::PARAM_INT);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function tokenExists(string $token): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM access_tokens WHERE token = :token AND expires_at > NOW() LIMIT 1');
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        $exists = (bool)$stmt->fetchColumn();
        $stmt->closeCursor();
        return $exists;
    }

    /**
     * Refresh token storage (opaque tokens)
     */
    private function ensureRefreshTable(): void
    {
        $sql = 'CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            revoked TINYINT(1) NOT NULL DEFAULT 0,
            replaced_by VARCHAR(255) DEFAULT NULL,
            INDEX idx_rt_user (user_id),
            INDEX idx_rt_expires (expires_at),
            CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
        $this->db->exec($sql);
    }

    public function storeRefreshToken(int $userId, string $token, int $expiresInSeconds): void
    {
        $this->ensureRefreshTable();
        $stmt = $this->db->prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (:uid, :token, DATE_ADD(NOW(), INTERVAL :exp SECOND))');
        $stmt->bindParam(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->bindParam(':exp', $expiresInSeconds, PDO::PARAM_INT);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function findValidRefreshToken(string $token): ?array
    {
        $this->ensureRefreshTable();
        $stmt = $this->db->prepare('SELECT id, user_id, token, expires_at, revoked, replaced_by FROM refresh_tokens WHERE token = :token AND expires_at > NOW() LIMIT 1');
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if (!$row || (int)$row['revoked'] === 1 || !empty($row['replaced_by'])) {
            return null;
        }
        return $row;
    }

    public function revokeRefreshToken(string $token, ?string $replacedBy = null): void
    {
        $this->ensureRefreshTable();
        $stmt = $this->db->prepare('UPDATE refresh_tokens SET revoked = 1, replaced_by = :rep WHERE token = :token');
        $stmt->bindParam(':rep', $replacedBy);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        $stmt->closeCursor();
    }

    /**
     * Simple login attempt limiter using user_limits (keyed by identifier)
     */
    public function checkAndIncrementLoginAttempts(string $identifier, int $windowSeconds = 900, int $maxAttempts = 10): void
    {
        // Create row if not exists
        $stmt = $this->db->prepare('INSERT INTO user_limits (username, limit_check, updated_at) VALUES (:u, 0, NOW()) ON DUPLICATE KEY UPDATE username = username');
        $stmt->bindParam(':u', $identifier);
        $stmt->execute();
        $stmt->closeCursor();

        // Fetch current
        $stmt = $this->db->prepare('SELECT limit_check, updated_at FROM user_limits WHERE username = :u');
        $stmt->bindParam(':u', $identifier);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        $count = (int)($row['limit_check'] ?? 0);
        $updatedAt = strtotime((string)($row['updated_at'] ?? 'now')) ?: time();
        // Reset if window expired
        if (time() - $updatedAt > $windowSeconds) {
            $count = 0;
        }

        $count++;
        $stmt = $this->db->prepare('UPDATE user_limits SET limit_check = :c, updated_at = NOW() WHERE username = :u');
        $stmt->bindValue(':c', $count, PDO::PARAM_INT);
        $stmt->bindParam(':u', $identifier);
        $stmt->execute();
        $stmt->closeCursor();

        if ($count > $maxAttempts) {
            throw new \App\Exceptions\ApiException(429, 'TOO_MANY_TRIES', 'Too many attempts, try later');
        }
    }

    public function resetLoginAttempts(string $identifier): void
    {
        $stmt = $this->db->prepare('UPDATE user_limits SET limit_check = 0, updated_at = NOW() WHERE username = :u');
        $stmt->bindParam(':u', $identifier);
        $stmt->execute();
        $stmt->closeCursor();
    }
}