<?php
declare(strict_types=1);

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$filePath = __DIR__ . $requestUri;

// Serve existing static files directly
if ($requestUri !== '/' && file_exists($filePath) && is_file($filePath)) {
    return false;
}

// Fallback to the front controller
require __DIR__ . '/index.php';


