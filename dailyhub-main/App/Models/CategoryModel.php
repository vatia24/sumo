<?php

namespace App\Models;

use Config\Db;
use PDO;
use Throwable;
use Exception;

class CategoryModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    public function list(array $filters = []): array
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['parent_id'])) {
                if ($filters['parent_id'] === null) {
                    $where[] = 'c.parent_id IS NULL';
                } else {
                    $where[] = 'c.parent_id = :parent_id';
                    $params[':parent_id'] = (int)$filters['parent_id'];
                }
            }

            if (!empty($filters['q'])) {
                $where[] = '(c.name LIKE :q OR c.slug LIKE :q)';
                $params[':q'] = '%' . $filters['q'] . '%';
            }

            $limit = isset($filters['limit']) ? max(0, (int)$filters['limit']) : 100;
            $limit = min($limit, 500);
            $offset = isset($filters['offset']) ? max(0, (int)$filters['offset']) : 0;

            $sql = 'SELECT c.id, c.name, c.slug, c.parent_id, c.image_path, c.created_at, c.updated_at FROM category c';
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY c.parent_id IS NOT NULL, c.parent_id, c.name ASC LIMIT :limit OFFSET :offset';

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            throw new Exception('Error listing categories: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function getById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT id, name, slug, parent_id, image_path, created_at, updated_at FROM category WHERE id = :id');
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (Throwable $e) {
            throw new Exception('Error fetching category: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function getBySlug(string $slug): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT id, name, slug, parent_id, image_path, created_at, updated_at FROM category WHERE slug = :slug');
            $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (Throwable $e) {
            throw new Exception('Error fetching category by slug: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function upsert(array $data): int
    {
        try {
            $hasId = !empty($data['id']);
            if ($hasId) {
                $allowed = ['name', 'slug', 'parent_id', 'image_path'];
                $setParts = [];
                foreach ($allowed as $col) {
                    if (array_key_exists($col, $data)) {
                        $setParts[] = "$col = :$col";
                    }
                }
                if (empty($setParts)) {
                    return (int)$data['id'];
                }
                $sql = 'UPDATE category SET ' . implode(', ', $setParts) . ' WHERE id = :id';
                $stmt = $this->db->prepare($sql);
                $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
                if (array_key_exists('name', $data)) $stmt->bindValue(':name', (string)$data['name'], PDO::PARAM_STR);
                if (array_key_exists('slug', $data)) $stmt->bindValue(':slug', (string)$data['slug'], PDO::PARAM_STR);
                if (array_key_exists('parent_id', $data)) {
                    if ($data['parent_id'] === null) {
                        $stmt->bindValue(':parent_id', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':parent_id', (int)$data['parent_id'], PDO::PARAM_INT);
                    }
                }
                if (array_key_exists('image_path', $data)) {
                    if ($data['image_path'] === null) {
                        $stmt->bindValue(':image_path', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':image_path', (string)$data['image_path'], PDO::PARAM_STR);
                    }
                }
                $stmt->execute();
                return (int)$data['id'];
            } else {
                $stmt = $this->db->prepare('INSERT INTO category (name, slug, parent_id, image_path) VALUES (:name, :slug, :parent_id, :image_path)');
                $stmt->bindValue(':name', (string)$data['name'], PDO::PARAM_STR);
                $stmt->bindValue(':slug', (string)($data['slug'] ?? $this->slugify((string)$data['name'])), PDO::PARAM_STR);
                if (array_key_exists('parent_id', $data)) {
                    if ($data['parent_id'] === null) {
                        $stmt->bindValue(':parent_id', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':parent_id', (int)$data['parent_id'], PDO::PARAM_INT);
                    }
                } else {
                    $stmt->bindValue(':parent_id', null, PDO::PARAM_NULL);
                }
                if (array_key_exists('image_path', $data)) {
                    if ($data['image_path'] === null) {
                        $stmt->bindValue(':image_path', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':image_path', (string)$data['image_path'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':image_path', null, PDO::PARAM_NULL);
                }
                $stmt->execute();
                return (int)$this->db->lastInsertId();
            }
        } catch (Throwable $e) {
            throw new Exception('Error upserting category: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function delete(int $id): bool
    {
        try {
            // Cascade delete product mappings first
            $stmt = $this->db->prepare('DELETE FROM product_category WHERE category_id = :id');
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            // Remove as parent from children
            $stmt2 = $this->db->prepare('UPDATE category SET parent_id = NULL WHERE parent_id = :id');
            $stmt2->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt2->execute();
            // Delete category
            $stmt3 = $this->db->prepare('DELETE FROM category WHERE id = :id');
            $stmt3->bindValue(':id', $id, PDO::PARAM_INT);
            return $stmt3->execute();
        } catch (Throwable $e) {
            throw new Exception('Error deleting category: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function setImagePath(int $id, ?string $path): bool
    {
        try {
            $stmt = $this->db->prepare('UPDATE category SET image_path = :path WHERE id = :id');
            if ($path === null) {
                $stmt->bindValue(':path', null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(':path', $path, PDO::PARAM_STR);
            }
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (Throwable $e) {
            throw new Exception('Error updating category image: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function setProductCategories(int $productId, array $categoryIds): void
    {
        $categoryIds = array_values(array_unique(array_map('intval', $categoryIds)));
        $this->db->beginTransaction();
        try {
            $del = $this->db->prepare('DELETE FROM product_category WHERE product_id = :pid');
            $del->bindValue(':pid', $productId, PDO::PARAM_INT);
            $del->execute();
            if (!empty($categoryIds)) {
                $ins = $this->db->prepare('INSERT INTO product_category (product_id, category_id) VALUES (:pid, :cid)');
                foreach ($categoryIds as $cid) {
                    $ins->bindValue(':pid', $productId, PDO::PARAM_INT);
                    $ins->bindValue(':cid', (int)$cid, PDO::PARAM_INT);
                    $ins->execute();
                }
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw new Exception('Error setting product categories: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function listByProduct(int $productId): array
    {
        try {
            $stmt = $this->db->prepare('SELECT c.id, c.name, c.slug, c.parent_id, c.image_path FROM product_category pc INNER JOIN category c ON c.id = pc.category_id WHERE pc.product_id = :pid ORDER BY c.name');
            $stmt->bindValue(':pid', $productId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            throw new Exception('Error listing product categories: ' . $e->getMessage(), $e->getCode());
        }
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('~[^\pL\d]+~u', '-', $text) ?: $text;
        $text = trim($text, '-');
        $text = preg_replace('~[^-a-z0-9]+~', '', $text) ?: $text;
        return $text ?: ('cat-' . bin2hex(random_bytes(3)));
    }
}


