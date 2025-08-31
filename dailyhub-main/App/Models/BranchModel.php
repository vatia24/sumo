<?php

namespace App\Models;

use Config\Db;
use PDO;

class BranchModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    public function upsertBranch(array $data): int
    {
        if (!empty($data['id'])) {
            // Partial update for branches
            $allowed = ['company_id','branch_name','branch_address','branch_image'];
            $set = [];
            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $set[] = "$col = :$col";
                }
            }
            if (empty($set)) {
                return (int)$data['id'];
            }
            $sql = 'UPDATE company_branches SET ' . implode(', ', $set) . ' WHERE id=:id';
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
        } else {
            $stmt = $this->db->prepare('INSERT INTO company_branches (company_id, branch_name, branch_address, branch_image) VALUES (:company_id, :branch_name, :branch_address, :branch_image)');
        }
        if (empty($data['id'])) {
            $stmt->bindParam(':company_id', $data['company_id']);
            $stmt->bindParam(':branch_name', $data['branch_name']);
            $stmt->bindParam(':branch_address', $data['branch_address']);
            $stmt->bindParam(':branch_image', $data['branch_image']);
        }
        $stmt->execute();
        $stmt->closeCursor();
        return (int)($data['id'] ?? $this->db->lastInsertId());
    }
}


