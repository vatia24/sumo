<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class BadgeRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function listByUser(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT b.* , ub.awarded_at FROM user_badges ub INNER JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.awarded_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function award(int $userId, int $badgeId): bool
    {
        $stmt = $this->db->prepare('INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?, ?, NOW())');
        return $stmt->execute([$userId, $badgeId]);
    }
}


