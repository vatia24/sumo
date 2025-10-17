<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use App\Utils\Pagination;
use PDO;

final class ActionRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function log(int $userId, string $type, int $targetId, int $points): bool
    {
        // Log to actions (gamification) and also to dailyhub-main analytics table discount_actions when target is a discount
        $stmt = $this->db->prepare('INSERT INTO actions (user_id, type, target_id, points_awarded, created_at) VALUES (?, ?, ?, ?, NOW())');
        $ok = $stmt->execute([$userId, $type, $targetId, $points]);
        if ($ok && in_array($type, ['view-address','go-to-website','share','save-to-favorites','comment','visit-store','favorite','view','clicked'])) {
            // best-effort insert, ignore failure if table not present
            try {
                $map = [
                    'save-to-favorites' => 'favorite',
                    'go-to-website' => 'redirect',
                    'view-address' => 'map_open',
                ];
                $analyticsAction = $map[$type] ?? $type;
                $ins = $this->db->prepare('INSERT INTO discount_actions (discount_id, action, created_at, user_id) VALUES (?, ?, NOW(), ?)');
                $ins->execute([$targetId, $analyticsAction, $userId]);
            } catch (\Throwable $e) { /* ignore */ }
        }
        return $ok;
    }

    public function history(int $userId, int $limit = 50, ?string $cursor = null): array
    {
        $params = [$userId];
        $where = ['a.user_id = ?'];
        if ($cursor) {
            $decoded = Pagination::decodeCursor($cursor);
            if ($decoded) {
                $where[] = '(a.created_at, a.id) < (? , ?)';
                [$createdAt, $id] = explode('|', $decoded);
                $params[] = $createdAt;
                $params[] = (int)$id;
            }
        }
        $whereSql = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT a.* FROM actions a $whereSql ORDER BY a.created_at DESC, a.id DESC LIMIT ".$limit;
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


