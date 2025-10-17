<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class AuditRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function log(?int $userId, ?string $sessionKey, string $event, array $request, array $response, bool $blocked = false): void
    {
        $stmt = $this->db->prepare('INSERT INTO ai_audit_logs (user_id, session_key, event, request_json, response_json, blocked) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $userId,
            $sessionKey,
            $event,
            json_encode($request, JSON_UNESCAPED_SLASHES),
            json_encode($response, JSON_UNESCAPED_SLASHES),
            $blocked ? 1 : 0,
        ]);
    }
}


