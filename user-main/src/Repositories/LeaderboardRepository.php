<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class LeaderboardRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function top(string $period = 'weekly', int $limit = 50): array
    {
        $start = $period === 'monthly'
            ? date('Y-m-01 00:00:00')
            : date('Y-m-d 00:00:00', strtotime('monday this week'));
        $stmt = $this->db->prepare('SELECT a.user_id, SUM(a.points_awarded) as points FROM actions a WHERE a.created_at >= ? GROUP BY a.user_id ORDER BY points DESC LIMIT ' . $limit);
        $stmt->execute([$start]);
        return $stmt->fetchAll();
    }
}


