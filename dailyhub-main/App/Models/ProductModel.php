<?php

namespace App\Models;

use Config\Db;
use PDO;
use Throwable;
use Exception;

class ProductModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance(); // Assumes Db::getInstance() initializes the PDO connection
    }

    /**
     * Fetch all products with their latest active discount (if any).
     * Adds aliased discount fields and computed effective_price.
     *
     * @return array
     * @throws Exception
     */
    public function getAllProductsWithDiscounts(): array
    {
        try {
            $statement = $this->db->prepare(
                'SELECT 
                    p.*,
                    d.id AS discount_id,
                    d.discount_price,
                    d.discount_percent,
                    d.start_date AS discount_start_date,
                    d.end_date AS discount_end_date,
                    d.status AS discount_status,
                    d.created_at AS discount_created_at,
                    d.updated_at AS discount_updated_at,
                    COALESCE(img.path, p.image_url) AS primary_image_url,
                    CASE 
                        WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (1 - d.discount_percent/100), 2)
                        ELSE p.price
                    END AS effective_price,
                    CASE 
                        WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (d.discount_percent/100), 2)
                        ELSE NULL
                    END AS discount_amount
                 FROM product p
                 LEFT JOIN discount d 
                   ON d.product_id = p.id
                  AND d.status IN ("active", "scheduled")
                  AND (d.start_date IS NULL OR d.start_date <= CURDATE())
                  AND (d.end_date IS NULL OR d.end_date >= CURDATE())
                  AND d.updated_at = (
                        SELECT MAX(d2.updated_at) 
                        FROM discount d2 
                        WHERE d2.product_id = p.id 
                          AND d2.status IN ("active", "scheduled")
                          AND (d2.start_date IS NULL OR d2.start_date <= CURDATE())
                          AND (d2.end_date IS NULL OR d2.end_date >= CURDATE())
                  )
                 LEFT JOIN (
                    SELECT pi.product_id, pi.path
                    FROM product_images pi
                    INNER JOIN (
                        SELECT product_id, MAX(id) AS max_id
                        FROM product_images
                        GROUP BY product_id
                    ) pim ON pim.product_id = pi.product_id AND pim.max_id = pi.id
                 ) img ON img.product_id = p.id'
            );
            $statement->execute();

            return $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            throw new Exception('Error fetching all products: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Fetch a single product by ID with its latest active discount.
     * Adds aliased discount fields and computed effective_price.
     *
     * @param int $productId
     * @return array|null
     * @throws Exception
     */
    public function getProductWithDiscountById(int $productId): ?array
    {
        try {
            $statement = $this->db->prepare(
                'SELECT 
                    p.*,
                    d.id AS discount_id,
                    d.discount_price,
                    d.discount_percent,
                    d.start_date AS discount_start_date,
                    d.end_date AS discount_end_date,
                    d.status AS discount_status,
                    d.created_at AS discount_created_at,
                    d.updated_at AS discount_updated_at,
                    COALESCE(img.path, p.image_url) AS primary_image_url,
                    CASE 
                        WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (1 - d.discount_percent/100), 2)
                        ELSE p.price
                    END AS effective_price,
                    CASE 
                        WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (d.discount_percent/100), 2)
                        ELSE NULL
                    END AS discount_amount
                 FROM product p
                 LEFT JOIN discount d 
                   ON d.product_id = p.id
                  AND d.status IN ("active", "scheduled")
                  AND (d.start_date IS NULL OR d.start_date <= CURDATE())
                  AND (d.end_date IS NULL OR d.end_date >= CURDATE())
                  AND d.updated_at = (
                        SELECT MAX(d2.updated_at) 
                        FROM discount d2 
                        WHERE d2.product_id = p.id 
                          AND d2.status IN ("active", "scheduled")
                          AND (d2.start_date IS NULL OR d2.start_date <= CURDATE())
                          AND (d2.end_date IS NULL OR d2.end_date >= CURDATE())
                  )
                 LEFT JOIN (
                    SELECT pi.product_id, pi.path
                    FROM product_images pi
                    INNER JOIN (
                        SELECT product_id, MAX(id) AS max_id
                        FROM product_images
                        GROUP BY product_id
                    ) pim ON pim.product_id = pi.product_id AND pim.max_id = pi.id
                 ) img ON img.product_id = p.id
                 WHERE p.id = :productId'
            );
            $statement->bindParam(':productId', $productId, PDO::PARAM_INT);
            $statement->execute();

            $product = $statement->fetch(PDO::FETCH_ASSOC);
            return $product ?: null; // Return null if no product is found
        } catch (Throwable $e) {
            throw new Exception('Error fetching product by ID: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Add a new product.
     *
     * @param string $name
     * @param float $price
     * @return int ID of the newly created product
     * @throws Exception
     */
    public function addProduct(string $name, float $price): int
    {
        try {
            $statement = $this->db->prepare(
                'INSERT INTO product (name, price) VALUES (:name, :price)'
            );
            $statement->bindParam(':name', $name, PDO::PARAM_STR);
            $statement->bindParam(':price', $price, PDO::PARAM_STR);
            $statement->execute();

            return (int)$this->db->lastInsertId();
        } catch (Throwable $e) {
            throw new Exception('Error adding product: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Update a product.
     *
     * @param int $productId
     * @param string $name
     * @param float $price
     * @return bool
     * @throws Exception
     */
    public function updateProduct(int $productId, string $name, float $price): bool
    {
        try {
            $statement = $this->db->prepare(
                'UPDATE product 
                 SET name = :name, price = :price 
                 WHERE id = :productId'
            );
            $statement->bindParam(':productId', $productId, PDO::PARAM_INT);
            $statement->bindParam(':name', $name, PDO::PARAM_STR);
            $statement->bindParam(':price', $price, PDO::PARAM_STR);

            return $statement->execute();
        } catch (Throwable $e) {
            throw new Exception('Error updating product: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Delete a product.
     *
     * @param int $productId
     * @return bool
     * @throws Exception
     */
    public function deleteProduct(int $productId): bool
    {
        try {
            // Unlink images on disk first
            $imgStmt = $this->db->prepare('SELECT path FROM product_images WHERE product_id = :pid');
            $imgStmt->bindValue(':pid', $productId, PDO::PARAM_INT);
            $imgStmt->execute();
            $paths = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
            $imgStmt->closeCursor();
            foreach ($paths as $p) {
                if (!empty($p)) @unlink($p);
            }
            $statement = $this->db->prepare(
                'DELETE FROM product WHERE id = :productId'
            );
            $statement->bindParam(':productId', $productId, PDO::PARAM_INT);

            return $statement->execute();
        } catch (Throwable $e) {
            throw new Exception('Error deleting product: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * List products with optional filters: company_id, status, q, limit, offset
     *
     * @param array $filters
     * @return array
     * @throws Exception
     */
    public function listProducts(array $filters): array
    {
        try {
            $where = [];
            $params = [];

            if (!empty($filters['company_id'])) {
                $where[] = 'p.company_id = :company_id';
                $params[':company_id'] = (int)$filters['company_id'];
            }
            if (!empty($filters['branch_id'])) {
                $where[] = 'p.branch_id = :branch_id';
                $params[':branch_id'] = (int)$filters['branch_id'];
            }
            if (!empty($filters['status'])) {
                $where[] = 'p.status = :status';
                $params[':status'] = (string)$filters['status'];
            }
            if (!empty($filters['q'])) {
                $where[] = '(p.name LIKE :q OR p.description LIKE :q)';
                $params[':q'] = '%' . $filters['q'] . '%';
            }

            $limit = isset($filters['limit']) ? max(0, (int)$filters['limit']) : 20;
            $offset = isset($filters['offset']) ? max(0, (int)$filters['offset']) : 0;

            $sql = 'SELECT p.* FROM product p';
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset';

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            throw new Exception('Error listing products: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Insert or update a product record. Returns product id.
     *
     * @param array $data
     * @return int
     * @throws Exception
     */
    public function upsertProduct(array $data): int
    {
        try {
            $hasId = !empty($data['id']);

            if ($hasId) {
                // Partial update: only update fields provided in $data
                $allowed = [
                    'company_id', 'branch_id', 'name', 'description', 'price', 'image_url', 'address', 'link', 'status'
                ];
                $setParts = [];
                foreach ($allowed as $col) {
                    if (array_key_exists($col, $data)) {
                        $setParts[] = "$col = :$col";
                    }
                }
                if (empty($setParts)) {
                    return (int)$data['id'];
                }
                $sql = 'UPDATE product SET ' . implode(', ', $setParts) . ' WHERE id = :id';
                $stmt = $this->db->prepare($sql);
                $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);

                if (array_key_exists('company_id', $data)) {
                    $stmt->bindValue(':company_id', (int)$data['company_id'], PDO::PARAM_INT);
                }
                if (array_key_exists('branch_id', $data)) {
                    if ($data['branch_id'] === null) {
                        $stmt->bindValue(':branch_id', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':branch_id', (int)$data['branch_id'], PDO::PARAM_INT);
                    }
                }
                if (array_key_exists('name', $data)) {
                    $stmt->bindValue(':name', (string)$data['name'], PDO::PARAM_STR);
                }
                if (array_key_exists('description', $data)) {
                    if ($data['description'] === null) {
                        $stmt->bindValue(':description', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':description', (string)$data['description'], PDO::PARAM_STR);
                    }
                }
                if (array_key_exists('price', $data)) {
                    if ($data['price'] === null) {
                        $stmt->bindValue(':price', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':price', (string)$data['price'], PDO::PARAM_STR);
                    }
                }
                if (array_key_exists('image_url', $data)) {
                    if ($data['image_url'] === null) {
                        $stmt->bindValue(':image_url', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':image_url', (string)$data['image_url'], PDO::PARAM_STR);
                    }
                }
                if (array_key_exists('address', $data)) {
                    if ($data['address'] === null) {
                        $stmt->bindValue(':address', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':address', (string)$data['address'], PDO::PARAM_STR);
                    }
                }
                if (array_key_exists('link', $data)) {
                    if ($data['link'] === null) {
                        $stmt->bindValue(':link', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':link', (string)$data['link'], PDO::PARAM_STR);
                    }
                }
                if (array_key_exists('status', $data)) {
                    $stmt->bindValue(':status', (string)$data['status'], PDO::PARAM_STR);
                }
            } else {
                $stmt = $this->db->prepare(
                    'INSERT INTO product (
                        user_id, company_id, branch_id, name, description, price, image_url, address, link, status
                    ) VALUES (
                        :user_id, :company_id, :branch_id, :name, :description, :price, :image_url, :address, :link, :status
                    )'
                );
                $stmt->bindValue(':user_id', (int)($data['user_id'] ?? 0), PDO::PARAM_INT);
                $stmt->bindValue(':company_id', (int)$data['company_id'], PDO::PARAM_INT);
                if (array_key_exists('branch_id', $data)) {
                    if ($data['branch_id'] === null) {
                        $stmt->bindValue(':branch_id', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':branch_id', (int)$data['branch_id'], PDO::PARAM_INT);
                    }
                } else {
                    $stmt->bindValue(':branch_id', null, PDO::PARAM_NULL);
                }
                $stmt->bindValue(':name', (string)$data['name'], PDO::PARAM_STR);
                if (array_key_exists('description', $data)) {
                    if ($data['description'] === null) {
                        $stmt->bindValue(':description', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':description', (string)$data['description'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':description', null, PDO::PARAM_NULL);
                }
                if (array_key_exists('price', $data)) {
                    if ($data['price'] === null) {
                        $stmt->bindValue(':price', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':price', (string)$data['price'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':price', null, PDO::PARAM_NULL);
                }
                if (array_key_exists('image_url', $data)) {
                    if ($data['image_url'] === null) {
                        $stmt->bindValue(':image_url', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':image_url', (string)$data['image_url'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':image_url', null, PDO::PARAM_NULL);
                }
                if (array_key_exists('address', $data)) {
                    if ($data['address'] === null) {
                        $stmt->bindValue(':address', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':address', (string)$data['address'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':address', null, PDO::PARAM_NULL);
                }
                if (array_key_exists('link', $data)) {
                    if ($data['link'] === null) {
                        $stmt->bindValue(':link', null, PDO::PARAM_NULL);
                    } else {
                        $stmt->bindValue(':link', (string)$data['link'], PDO::PARAM_STR);
                    }
                } else {
                    $stmt->bindValue(':link', null, PDO::PARAM_NULL);
                }
                $stmt->bindValue(':status', (string)$data['status'], PDO::PARAM_STR);
            }

            $stmt->execute();

            if ($hasId) {
                return (int)$data['id'];
            }
            return (int)$this->db->lastInsertId();
        } catch (Throwable $e) {
            throw new Exception('Error upserting product: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Get product by id.
     *
     * @param int $id
     * @return array|null
     * @throws Exception
     */
    public function getById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare('SELECT * FROM product WHERE id = :id');
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (Throwable $e) {
            throw new Exception('Error fetching product: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Bulk set status for products by ids. Returns affected row count.
     *
     * @param array $ids
     * @param string $status
     * @return int
     * @throws Exception
     */
    public function bulkSetStatus(array $ids, string $status): int
    {
        if (empty($ids)) return 0;
        $ids = array_values(array_unique(array_map('intval', $ids)));
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        try {
            $stmt = $this->db->prepare("UPDATE product SET status = ? WHERE id IN ($placeholders)");
            $bindValues = array_merge([$status], $ids);
            foreach ($bindValues as $index => $value) {
                $stmt->bindValue($index + 1, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();
            return $stmt->rowCount();
        } catch (Throwable $e) {
            throw new Exception('Error updating product statuses: ' . $e->getMessage(), $e->getCode());
        }
    }

    /**
     * Image helpers
     */
    public function addImage(int $productId, string $path): int
    {
        try {
            $stmt = $this->db->prepare('INSERT INTO product_images (product_id, path) VALUES (:pid, :path)');
            $stmt->bindValue(':pid', $productId, PDO::PARAM_INT);
            $stmt->bindValue(':path', $path, PDO::PARAM_STR);
            $stmt->execute();
            return (int)$this->db->lastInsertId();
        } catch (Throwable $e) {
            throw new Exception('Error adding product image: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function listImages(int $productId): array
    {
        try {
            $stmt = $this->db->prepare('SELECT id, path, created_at FROM product_images WHERE product_id = :pid ORDER BY id DESC');
            $stmt->bindValue(':pid', $productId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            throw new Exception('Error listing product images: ' . $e->getMessage(), $e->getCode());
        }
    }

    public function deleteImage(int $imageId): bool
    {
        try {
            // Lookup path to unlink file from disk
            $lookup = $this->db->prepare('SELECT path FROM product_images WHERE id = :id');
            $lookup->bindValue(':id', $imageId, PDO::PARAM_INT);
            $lookup->execute();
            $row = $lookup->fetch(PDO::FETCH_ASSOC);
            $lookup->closeCursor();

            if ($row && !empty($row['path'])) {
                @unlink($row['path']);
            }

            $stmt = $this->db->prepare('DELETE FROM product_images WHERE id = :id');
            $stmt->bindValue(':id', $imageId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (Throwable $e) {
            throw new Exception('Error deleting product image: ' . $e->getMessage(), $e->getCode());
        }
    }
}