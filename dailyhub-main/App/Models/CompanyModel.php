<?php

namespace App\Models;

use Config\Db;
use PDO;

class CompanyModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    public function getCompanyById(int $companyId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM companies WHERE id = :id');
        $stmt->bindParam(':id', $companyId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $row ?: null;
    }

    public function getCompanyByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM companies WHERE user_id = :user_id LIMIT 1');
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $row ?: null;
    }

    public function upsertCompany(array $data): int
    {
        // Allowed columns in companies table
        $allowed = [
            'full_name', 'address', 'city', 'postal_code', 'country', 'status',
            'latitude', 'longitude', 'logo_url'
        ];

        if (!empty($data['id'])) {
            // Partial update: only update provided fields
            $setParts = [];
            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $setParts[] = "$col = :$col";
                }
            }
            if (empty($setParts)) {
                return (int)$data['id'];
            }
            $sql = 'UPDATE companies SET ' . implode(', ', $setParts) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);

            foreach ($allowed as $col) {
                if (!array_key_exists($col, $data)) continue;
                $value = $data[$col];
                if ($value === null) {
                    $stmt->bindValue(":$col", null, PDO::PARAM_NULL);
                } else {
                    $paramType = in_array($col, ['latitude','longitude']) ? PDO::PARAM_STR : PDO::PARAM_STR;
                    $stmt->bindValue(":$col", (string)$value, $paramType);
                }
            }
            $stmt->execute();
            $stmt->closeCursor();
            return (int)$data['id'];
        }

        // Insert: require user_id and full_name at minimum
        $columns = ['user_id', 'full_name'];
        $placeholders = [':user_id', ':full_name'];
        $bindings = [
            [':user_id', (int)$data['user_id'], PDO::PARAM_INT],
            [':full_name', (string)($data['full_name'] ?? ''), PDO::PARAM_STR],
        ];

        foreach ($allowed as $col) {
            if (!array_key_exists($col, $data)) continue;
            $columns[] = $col;
            $placeholders[] = ":$col";
            $val = $data[$col];
            if ($val === null) {
                $bindings[] = [":$col", null, PDO::PARAM_NULL];
            } else {
                $paramType = in_array($col, ['latitude','longitude']) ? PDO::PARAM_STR : PDO::PARAM_STR;
                $bindings[] = [":$col", (string)$val, $paramType];
            }
        }

        $sql = 'INSERT INTO companies (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = $this->db->prepare($sql);
        foreach ($bindings as [$name, $val, $type]) {
            $stmt->bindValue($name, $val, $type);
        }
        $stmt->execute();
        $stmt->closeCursor();
        return (int)$this->db->lastInsertId();
    }

    public function getUserRoleForCompany(int $userId, int $companyId): ?string
    {
        // Owner if matches companies.user_id
        $stmt = $this->db->prepare('SELECT CASE WHEN c.user_id = :uid THEN "Owner" ELSE NULL END as role FROM companies c WHERE c.id = :cid');
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $owner = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        if (!empty($owner['role'])) return 'Owner';

        // Otherwise try sub_user role
        $stmt = $this->db->prepare('SELECT role FROM sub_user WHERE user_id = :uid AND company_id = :cid AND active = 1 LIMIT 1');
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $row['role'] ?? null;
    }

    public function setStatus(int $companyId, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE companies SET status = :status WHERE id = :id');
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $companyId);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Hours
    public function replaceHours(int $companyId, array $hours): void
    {
        $this->db->beginTransaction();
        $del = $this->db->prepare('DELETE FROM company_hours WHERE company_id = :cid');
        $del->bindParam(':cid', $companyId);
        $del->execute();

        $ins = $this->db->prepare('INSERT INTO company_hours (company_id, day_of_week, open_time, close_time, is_closed) VALUES (:cid, :dow, :open_time, :close_time, :is_closed)');
        foreach ($hours as $row) {
            $ins->bindValue(':cid', $companyId);
            $ins->bindValue(':dow', (int)$row['day_of_week']);
            $ins->bindValue(':open_time', $row['open_time']);
            $ins->bindValue(':close_time', $row['close_time']);
            $ins->bindValue(':is_closed', (int)($row['is_closed'] ?? 0));
            $ins->execute();
        }
        $this->db->commit();
    }

    public function getHours(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT day_of_week, open_time, close_time, is_closed FROM company_hours WHERE company_id = :cid ORDER BY day_of_week');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    // Socials
    public function addSocial(int $companyId, string $platform, string $url): int
    {
        $stmt = $this->db->prepare('INSERT INTO company_socials (company_id, platform, url) VALUES (:cid, :platform, :url)');
        $stmt->bindParam(':cid', $companyId);
        $stmt->bindParam(':platform', $platform);
        $stmt->bindParam(':url', $url);
        $stmt->execute();
        $stmt->closeCursor();
        return (int)$this->db->lastInsertId();
    }

    public function listSocials(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, platform, url FROM company_socials WHERE company_id = :cid ORDER BY id');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function deleteSocial(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM company_socials WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Gallery
    public function addGallery(int $companyId, string $path): int
    {
        $stmt = $this->db->prepare('INSERT INTO company_gallery (company_id, path) VALUES (:cid, :path)');
        $stmt->bindParam(':cid', $companyId);
        $stmt->bindParam(':path', $path);
        $stmt->execute();
        $stmt->closeCursor();
        return (int)$this->db->lastInsertId();
    }

    public function listGallery(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, path FROM company_gallery WHERE company_id = :cid ORDER BY id');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function deleteGallery(int $id): void
    {
        // Lookup path to unlink file before deleting record
        $find = $this->db->prepare('SELECT path FROM company_gallery WHERE id = :id');
        $find->bindParam(':id', $id);
        $find->execute();
        $row = $find->fetch(PDO::FETCH_ASSOC);
        $find->closeCursor();
        if ($row && !empty($row['path'])) {
            @unlink($row['path']);
        }
        $stmt = $this->db->prepare('DELETE FROM company_gallery WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Documents
    public function addDocument(int $companyId, string $docType, string $path): int
    {
        $stmt = $this->db->prepare('INSERT INTO company_documents (company_id, doc_type, path) VALUES (:cid, :type, :path)');
        $stmt->bindParam(':cid', $companyId);
        $stmt->bindParam(':type', $docType);
        $stmt->bindParam(':path', $path);
        $stmt->execute();
        $stmt->closeCursor();
        return (int)$this->db->lastInsertId();
    }

    public function listDocuments(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, doc_type, path, status, uploaded_at, reviewed_at, reviewer_id FROM company_documents WHERE company_id = :cid ORDER BY id');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function reviewDocument(int $docId, string $status, ?int $reviewerId = null): void
    {
        $stmt = $this->db->prepare('UPDATE company_documents SET status = :status, reviewed_at = NOW(), reviewer_id = :rid WHERE id = :id');
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':rid', $reviewerId);
        $stmt->bindParam(':id', $docId);
        $stmt->execute();
        $stmt->closeCursor();
    }

    public function deleteDocument(int $id): void
    {
        // Unlink file from disk, then delete DB row
        $find = $this->db->prepare('SELECT path FROM company_documents WHERE id = :id');
        $find->bindParam(':id', $id);
        $find->execute();
        $row = $find->fetch(PDO::FETCH_ASSOC);
        $find->closeCursor();
        if ($row && !empty($row['path'])) {
            @unlink($row['path']);
        }

        $stmt = $this->db->prepare('DELETE FROM company_documents WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Delivery zones
    public function upsertZone(array $data): int
    {
        $isUpdate = !empty($data['id']);
        if ($isUpdate) {
            // Partial update for delivery zone
            $allowed = ['name','zone_type','center_lat','center_lng','radius_m','polygon'];
            $set = [];
            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $set[] = "$col = :$col";
                }
            }
            if (empty($set)) {
                return (int)$data['id'];
            }
            $sql = 'UPDATE delivery_zones SET ' . implode(', ', $set) . ' WHERE id=:id AND company_id=:cid';
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
            $stmt->bindValue(':cid', (int)$data['company_id'], PDO::PARAM_INT);
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
            $stmt = $this->db->prepare('INSERT INTO delivery_zones (company_id, name, zone_type, center_lat, center_lng, radius_m, polygon) VALUES (:company_id, :name, :zone_type, :center_lat, :center_lng, :radius_m, :polygon)');
        }
        if (!$isUpdate) {
            $stmt->bindParam(':company_id', $data['company_id']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':zone_type', $data['zone_type']);
            $stmt->bindParam(':center_lat', $data['center_lat']);
            $stmt->bindParam(':center_lng', $data['center_lng']);
            $stmt->bindParam(':radius_m', $data['radius_m']);
            $stmt->bindParam(':polygon', $data['polygon']);
        }
        $stmt->execute();
        $stmt->closeCursor();
        return $isUpdate ? (int)$data['id'] : (int)$this->db->lastInsertId();
    }

    public function listZones(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, name, zone_type, center_lat, center_lng, radius_m, polygon FROM delivery_zones WHERE company_id = :cid ORDER BY id');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function deleteZone(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM delivery_zones WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Branch helpers (list/delete)
    public function listBranches(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, branch_name, branch_address, branch_image FROM company_branches WHERE company_id = :cid ORDER BY id');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function deleteBranch(int $id): void
    {
        // Attempt to unlink branch image if present
        $q = $this->db->prepare('SELECT branch_image FROM company_branches WHERE id = :id');
        $q->bindParam(':id', $id);
        $q->execute();
        $img = $q->fetch(PDO::FETCH_ASSOC);
        $q->closeCursor();
        if ($img && !empty($img['branch_image'])) {
            @unlink($img['branch_image']);
        }
        $stmt = $this->db->prepare('DELETE FROM company_branches WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }

    // Contacts
    public function addContact(int $userId, int $companyId, ?string $phone, ?string $email, ?string $address): int
    {
        $stmt = $this->db->prepare('INSERT INTO contact (user_id, company_id, phone, email, address) VALUES (:uid, :cid, :phone, :email, :address)');
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':cid', $companyId);
        $stmt->bindParam(':phone', $phone);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':address', $address);
        $stmt->execute();
        $stmt->closeCursor();
        return (int)$this->db->lastInsertId();
    }

    public function listContacts(int $companyId): array
    {
        $stmt = $this->db->prepare('SELECT id, phone, email, address, created_at FROM contact WHERE company_id = :cid ORDER BY id DESC');
        $stmt->bindParam(':cid', $companyId);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    public function deleteContact(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM contact WHERE id = :id');
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $stmt->closeCursor();
    }
}


