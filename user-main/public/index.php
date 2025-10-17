<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$__envBase = dirname(__DIR__);
if (is_file($__envBase . DIRECTORY_SEPARATOR . '.env')) {
    $dotenv = Dotenv::createImmutable($__envBase);
    $dotenv->safeLoad();
} elseif (is_file($__envBase . DIRECTORY_SEPARATOR . '.env.example')) {
    $dotenv = Dotenv::createImmutable($__envBase, '.env.example');
    $dotenv->safeLoad();
}

use App\Utils\Router;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\RateLimiter;

header('Content-Type: application/json');
// Basic CORS and security headers (mirrors dailyhub-main defaults)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter(array_map('trim', explode(',', (string)($_ENV['ALLOWED_ORIGINS'] ?? ''))));
$isDev = (($_ENV['APP_ENV'] ?? 'production') === 'development');

if ($isDev || ($origin && in_array($origin, $allowedOrigins, true))) {
    if ($origin) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 600');
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
header('X-Frame-Options: DENY');
if (!$isDev && ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'))) {
    header('Strict-Transport-Security: max-age=15552000; includeSubDomains');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router(new Request(), new Response(), new RateLimiter(dirname(__DIR__) . '/storage/ratelimit'));

(require __DIR__ . '/../src/routes.php')($router);

$router->dispatch();

