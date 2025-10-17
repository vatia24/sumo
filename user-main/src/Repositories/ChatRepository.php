<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class ChatRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function createSession(?int $userId, string $sessionKey, ?string $title = null): int
    {
        $stmt = $this->db->prepare('INSERT INTO chat_sessions (session_key, user_id, title) VALUES (?, ?, ?)');
        $stmt->execute([$sessionKey, $userId, $title]);
        return (int)$this->db->lastInsertId();
    }

    public function findSessionByKey(string $sessionKey): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM chat_sessions WHERE session_key = ?');
        $stmt->execute([$sessionKey]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function listSessions(?int $userId, int $limit = 20): array
    {
        if ($userId) {
            $stmt = $this->db->prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY last_activity_at DESC LIMIT ' . $limit);
            $stmt->execute([$userId]);
        } else {
            $stmt = $this->db->query('SELECT * FROM chat_sessions ORDER BY last_activity_at DESC LIMIT ' . $limit);
        }
        return $stmt->fetchAll() ?: [];
    }

    public function deleteSession(string $sessionKey, ?int $userId = null): bool
    {
        if ($userId) {
            $stmt = $this->db->prepare('DELETE FROM chat_sessions WHERE session_key = ? AND (user_id = ? OR user_id IS NULL)');
            return $stmt->execute([$sessionKey, $userId]);
        }
        $stmt = $this->db->prepare('DELETE FROM chat_sessions WHERE session_key = ?');
        return $stmt->execute([$sessionKey]);
    }

    public function appendMessage(int $sessionId, string $role, string $content): void
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)');
            $stmt->execute([$sessionId, $role, $content]);
            $this->db->prepare('UPDATE chat_sessions SET last_activity_at = NOW() WHERE id = ?')->execute([$sessionId]);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function listMessages(int $sessionId, int $limit = 50): array
    {
        $stmt = $this->db->prepare('SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT ' . $limit);
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll() ?: [];
    }
}


