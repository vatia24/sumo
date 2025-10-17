<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class ChallengeRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function active(): array
    {
        $stmt = $this->db->query('SELECT * FROM challenges WHERE start_at <= NOW() AND end_at >= NOW() ORDER BY start_at DESC');
        return $stmt->fetchAll();
    }

    public function markCompleted(int $userId, int $challengeId): bool
    {
        $stmt = $this->db->prepare('INSERT INTO user_challenges (user_id, challenge_id, progress_json, completed_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE completed_at = VALUES(completed_at)');
        return $stmt->execute([$userId, $challengeId, json_encode(['completed' => true])]);
    }
}


