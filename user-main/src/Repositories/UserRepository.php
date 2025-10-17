<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function findById(int $id): ?array
    {
        $sql = 'SELECT u.id, u.username, u.name, u.email, up.photo_url, up.points, up.level FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id WHERE u.id = ?';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createProfileIfMissing(int $userId): void
    {
        $stmt = $this->db->prepare('INSERT IGNORE INTO user_profiles (user_id, points, level) VALUES (?, 0, 1)');
        $stmt->execute([$userId]);
    }

    public function updateProfile(int $id, ?string $name, ?string $photoUrl): bool
    {
        // Update core name in users, and photo in user_profiles
        if ($name !== null) {
            $stmt = $this->db->prepare('UPDATE users SET name = ? WHERE id = ?');
            $stmt->execute([$name, $id]);
        }
        if ($photoUrl !== null) {
            $this->createProfileIfMissing($id);
            $stmt = $this->db->prepare('UPDATE user_profiles SET photo_url = ? WHERE user_id = ?');
            $stmt->execute([$photoUrl, $id]);
        }
        return true;
    }

    public function addPoints(int $userId, int $points): bool
    {
        $this->createProfileIfMissing($userId);
        $stmt = $this->db->prepare('UPDATE user_profiles SET points = points + ?, level = GREATEST(1, FLOOR(points / 100) + 1) WHERE user_id = ?');
        return $stmt->execute([$points, $userId]);
    }
}


