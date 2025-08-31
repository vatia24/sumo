<?php

namespace App\Models;

use Config\Db;
use PDO;

class UserModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance(); // Assumes Db::getInstance() initializes the PDO connection
    }

    public function checkLimit(string $username): int
    {
        $stmt = $this->db->prepare('SELECT limit_check FROM user_limits WHERE username = :username');
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $limit = $stmt->fetchColumn();
        $stmt->closeCursor();
        return $limit !== false ? (int)$limit : 0;
    }

    //1. **`get_user_by_email`**
    //1. **`get_user_by_oauth`**
    //1. **`create_user`**

    public function checkUserCredentials(array $credentials)
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $stmt->bindParam(':username', $credentials['username']);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $result ?: null;
    }

    public function register(array $data): false|string
    {
        $query = 'INSERT INTO users (username, name, email, mobile, password, user_type)
              VALUES (:username, :name, :email, :mobile, :password, :type)';

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':mobile', $data['mobile']);
        $stmt->bindParam(':type', $data['type']);

        $options = [
            'memory_cost' => 1 << 16, // 64 MB (adjust based on server capacity)
            'time_cost'   => 4,      // Number of iterations
            'threads'     => 2       // Parallel threads
        ];
        $password_hash = password_hash($data['password'], PASSWORD_ARGON2ID, $options);
        $stmt->bindParam(':password', $password_hash);

        $stmt->execute();

        return $this->db->lastInsertId();
    }

    public function findUserByMailOrNumber($email, $mobile)
    {
        $query = 'SELECT id FROM users WHERE email = :email OR mobile = :mobile LIMIT 1';
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        return $result;
    }

    public function updateUser(array $data): void
    {
        // Partial update for users
        $allowed = ['name','email','mobile','user_type','status'];
        $set = [];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $data)) {
                $set[] = "$col = :$col";
            }
        }
        if (empty($set)) return;
        $sql = 'UPDATE users SET ' . implode(', ', $set) . ' WHERE id = :id';
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
        foreach ($allowed as $col) {
            if (!array_key_exists($col, $data)) continue;
            $val = $data[$col];
            if ($val === null) {
                $stmt->bindValue(":$col", null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(":$col", (string)$val, PDO::PARAM_STR);
            }
        }
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function resetLimit(string $username): void
    {
        $stmt = $this->db->prepare('UPDATE user_limits SET limit_check = 0 WHERE username = :username');
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $user ?: null;
    }

}