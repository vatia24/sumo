<?php

// Static files for built-in server
if (PHP_SAPI === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $fullPath = __DIR__ . $path;
    if (is_file($fullPath)) {
        return false;
    }
}

use Dotenv\Dotenv;

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter(array_map('trim', explode(',', (string)($_ENV['ALLOWED_ORIGINS'] ?? ''))));
$isDev = (($_ENV['APP_ENV'] ?? 'production') === 'development');
if ($isDev && $origin === '') { $origin = '*'; }
if ($origin && ($isDev || in_array($origin, $allowedOrigins, true))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

// Security headers
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Permissions-Policy: geolocation=(), microphone=(), camera=()");
header("X-Frame-Options: DENY");
if (!$isDev && ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'))) {
    header('Strict-Transport-Security: max-age=15552000; includeSubDomains');
}

// Error reporting
if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Routes
$dispatcher = FastRoute\simpleDispatcher(function (FastRoute\RouteCollector $r) {
    $r->addRoute('GET', '/health', function () {
        header('Content-Type: application/json');
        echo json_encode(['ok' => true]);
    });
    $r->addRoute('GET', '/v1/feed', ['App\\Controllers\\FeedController', 'list']);
    $r->addRoute('GET', '/v1/discount', ['App\\Controllers\\FeedController', 'detail']);
    $r->addRoute('GET', '/v1/map', ['App\\Controllers\\FeedController', 'map']);
    $r->addRoute('GET', '/swagger', function () { require __DIR__ . '/swagger/index.html'; });
});

$httpMethod = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
if (false !== $pos = strpos($uri, '?')) { $uri = substr($uri, 0, $pos); }
$uri = rawurldecode($uri);
$routeInfo = $dispatcher->dispatch($httpMethod, $uri);

switch ($routeInfo[0]) {
    case FastRoute\Dispatcher::NOT_FOUND:
        http_response_code(404); header('Content-Type: application/json'); echo json_encode(['error' => '404 - Not Found']); break;
    case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
        http_response_code(405); header('Content-Type: application/json'); echo json_encode(['error' => '405 - Method Not Allowed']); break;
    case FastRoute\Dispatcher::FOUND:
        $handler = $routeInfo[1];
        $vars = $routeInfo[2];
        if (is_callable($handler)) { $handler(); break; }
        [$class, $action] = $handler;
        try {
            $controller = new $class(new App\Models\FeedModel());
            $controller->$action($_GET);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            $isDev = (($_ENV['APP_ENV'] ?? 'production') === 'development');
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => $isDev ? $e->getMessage() : null
            ]);
        }
        break;
}

