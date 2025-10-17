<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

// Simple CSRF token for basic protection
session_start();
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

$db = Database::connection();

// Ensure upload directory exists
$uploadDir = __DIR__ . '/images/category';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0775, true);
}

$error = null;
$success = null;

// Handle create/update
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!isset($_POST['csrf']) || !hash_equals($_SESSION['csrf'], (string)$_POST['csrf'])) {
        $error = 'Invalid CSRF token';
    } else {
        $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
        $name = trim((string)($_POST['name'] ?? ''));
        $slug = trim((string)($_POST['slug'] ?? ''));
        $parentIdRaw = $_POST['parent_id'] ?? '';
        $parentId = ($parentIdRaw === '' ? null : (int)$parentIdRaw);
        $imagePathDb = null;

        if ($name === '' || $slug === '') {
            $error = 'Name and slug are required';
        }

        // Handle optional image upload
        if (!$error && isset($_FILES['image']) && is_array($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $fileError = (int)$_FILES['image']['error'];
            if ($fileError === UPLOAD_ERR_OK) {
                $tmp = (string)$_FILES['image']['tmp_name'];
                $origName = (string)$_FILES['image']['name'];
                $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                $allowed = ['jpg','jpeg','png','gif','webp'];
                if (!in_array($ext, $allowed, true)) {
                    $error = 'Invalid image type';
                } else {
                    $safeName = preg_replace('/[^a-z0-9\-]+/i', '-', pathinfo($origName, PATHINFO_FILENAME));
                    $finalName = $safeName . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
                    $destFs = $uploadDir . '/' . $finalName;
                    if (!move_uploaded_file($tmp, $destFs)) {
                        $error = 'Failed to move uploaded file';
                    } else {
                        // Normalize to web path with optional prefix
                        $relative = 'images/category/' . $finalName;
                        $relative = str_replace('\\', '/', $relative);
                        $assetPrefix = trim((string)($_ENV['ASSET_PREFIX'] ?? ''), '/');
                        if ($assetPrefix !== '') {
                            $imagePathDb = '/' . $assetPrefix . '/' . ltrim($relative, '/');
                        } else {
                            $imagePathDb = '/' . ltrim($relative, '/');
                        }
                    }
                }
            } else {
                $error = 'Upload error: ' . $fileError;
            }
        }

        if (!$error) {
            if ($id) {
                // Update
                if ($imagePathDb) {
                    $stmt = $db->prepare('UPDATE category SET name = ?, slug = ?, parent_id = ?, image_path = ? WHERE id = ?');
                    $stmt->execute([$name, $slug, $parentId, $imagePathDb, $id]);
                } else {
                    $stmt = $db->prepare('UPDATE category SET name = ?, slug = ?, parent_id = ? WHERE id = ?');
                    $stmt->execute([$name, $slug, $parentId, $id]);
                }
                $success = 'Category updated';
            } else {
                // Insert
                $stmt = $db->prepare('INSERT INTO category (name, slug, parent_id, image_path) VALUES (?, ?, ?, ?)');
                $stmt->execute([$name, $slug, $parentId, $imagePathDb]);
                $success = 'Category created';
            }
        }
    }
}

// Fetch existing categories for listing and parent selection
$rows = [];
try {
    $stmt = $db->query('SELECT id, name, slug, parent_id, image_path FROM category ORDER BY parent_id IS NOT NULL, parent_id, name');
    $rows = $stmt->fetchAll() ?: [];
} catch (Throwable $e) {
    $error = $error ?: 'DB error: ' . $e->getMessage();
}

// Build parent options
$parents = array_filter($rows, fn($r) => $r['parent_id'] === null);

?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Categories Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .row { display: flex; gap: 24px; align-items: flex-start; }
        form { border: 1px solid #ddd; padding: 16px; border-radius: 8px; width: 420px; position: sticky; top: 16px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background:#f5f5f5; text-align: left; }
        .alert { padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; }
        .alert.error { background: #ffe5e5; color: #8a1f1f; border: 1px solid #f1b0b0; }
        .alert.success { background: #e8ffef; color: #1f7a3e; border: 1px solid #b8e0c7; }
        .muted { color: #666; font-size: 12px; }
        .actions { display:flex; gap:8px; }
        input[type="text"], select { width: 100%; padding: 8px; margin: 6px 0 12px; box-sizing: border-box; }
        input[type="file"] { margin: 6px 0 12px; }
        button { padding: 8px 12px; cursor: pointer; }
    </style>
    <script>
        function fillForm(id, name, slug, parentId) {
            document.getElementById('id').value = id || '';
            document.getElementById('name').value = name || '';
            document.getElementById('slug').value = slug || '';
            document.getElementById('parent_id').value = parentId === null ? '' : parentId;
            document.getElementById('image').value = '';
            document.getElementById('submitBtn').textContent = id ? 'Update Category' : 'Create Category';
        }
    </script>
</head>
<body>
    <h2>Categories Admin</h2>
    <?php if ($error): ?>
        <div class="alert error"><?php echo htmlspecialchars($error, ENT_QUOTES); ?></div>
    <?php elseif ($success): ?>
        <div class="alert success"><?php echo htmlspecialchars($success, ENT_QUOTES); ?></div>
    <?php endif; ?>

    <div class="row">
        <form method="post" enctype="multipart/form-data">
            <input type="hidden" name="csrf" value="<?php echo htmlspecialchars($_SESSION['csrf'], ENT_QUOTES); ?>">
            <input type="hidden" id="id" name="id" value="">
            <label>Name</label>
            <input type="text" id="name" name="name" required>

            <label>Slug</label>
            <input type="text" id="slug" name="slug" required placeholder="e.g. electronics">

            <label>Parent</label>
            <select id="parent_id" name="parent_id">
                <option value="">— Root (no parent) —</option>
                <?php foreach ($parents as $p): ?>
                    <option value="<?php echo (int)$p['id']; ?>"><?php echo htmlspecialchars($p['name'], ENT_QUOTES); ?></option>
                <?php endforeach; ?>
            </select>

            <label>Image (optional)</label>
            <input type="file" id="image" name="image" accept="image/*">

            <div class="muted">Images will be stored under /images/category</div>
            <button id="submitBtn" type="submit">Create Category</button>
            <button type="button" onclick="fillForm('', '', '', '')">Reset</button>
        </form>

        <div style="flex:1">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Parent</th>
                        <th>Image</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr>
                        <td><?php echo (int)$r['id']; ?></td>
                        <td><?php echo htmlspecialchars($r['name'], ENT_QUOTES); ?></td>
                        <td><?php echo htmlspecialchars($r['slug'], ENT_QUOTES); ?></td>
                        <td><?php echo $r['parent_id'] === null ? '-' : (int)$r['parent_id']; ?></td>
                        <td>
                            <?php if (!empty($r['image_path'])): ?>
                                <?php
                                    $src = (string)$r['image_path'];
                                    $src = str_replace('\\', '/', $src);
                                    if (!preg_match('#^https?://#i', $src)) {
                                        $src = '/' . ltrim($src, '/');
                                    }
                                ?>
                                <img src="<?php echo htmlspecialchars($src, ENT_QUOTES); ?>" alt="" style="height:40px">
                            <?php else: ?>
                                <span class="muted">none</span>
                            <?php endif; ?>
                        </td>
                        <td class="actions">
                            <button onclick="fillForm(<?php echo (int)$r['id']; ?>,'<?php echo htmlspecialchars($r['name'], ENT_QUOTES); ?>','<?php echo htmlspecialchars($r['slug'], ENT_QUOTES); ?>', <?php echo $r['parent_id'] === null ? 'null' : (int)$r['parent_id']; ?>)">Edit</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <p class="muted">Open this page at <code>/categories_admin.php</code>.</p>
</body>
</html>


