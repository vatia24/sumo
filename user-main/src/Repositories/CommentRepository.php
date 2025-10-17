<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use App\Utils\Pagination;
use PDO;

final class CommentRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function add(int $userId, int $discountId, string $text, int $rating): int
    {
        $stmt = $this->db->prepare('INSERT INTO comments (user_id, discount_id, text, rating, created_at, flagged) VALUES (?, ?, ?, ?, NOW(), 0)');
        $stmt->execute([$userId, $discountId, $text, $rating]);
        return (int)$this->db->lastInsertId();
    }

    public function listByDiscount(int $discountId, int $limit = 20, ?string $cursor = null): array
    {
        $params = [$discountId];
        $where = ['c.discount_id = ?'];
        if ($cursor) {
            $decoded = Pagination::decodeCursor($cursor);
            if ($decoded) {
                $where[] = '(c.created_at, c.id) < (? , ?)';
                [$createdAt, $id] = explode('|', $decoded);
                $params[] = $createdAt;
                $params[] = (int)$id;
            }
        }
        $whereSql = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT c.*, u.name as user_name, up.photo_url FROM comments c INNER JOIN users u ON u.id = c.user_id LEFT JOIN user_profiles up ON up.user_id = u.id $whereSql ORDER BY c.created_at DESC, c.id DESC LIMIT ".$limit;
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $nextCursor = null;
        if (count($rows) === $limit) {
            $last = end($rows);
            $nextCursor = Pagination::encodeCursor(($last['created_at'] ?? '') . '|' . (string)$last['id']);
        }
        return ['items' => $rows, 'nextCursor' => $nextCursor];
    }
}


