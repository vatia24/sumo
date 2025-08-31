<?php

// Allow PHP built-in server to serve existing static files (e.g., /swagger/dist/*)
if (PHP_SAPI === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $fullPath = __DIR__ . $path;
    if (is_file($fullPath)) {
        return false;
    }
}

use Dotenv\Dotenv;
use App\Controllers\ApiController;
use App\Exceptions\ApiException;

// Load environment variables using Dotenv
require __DIR__ . '/vendor/autoload.php';

// Load .env file if it exists, otherwise use defaults
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} else {
    // Set default environment variables for development
    $_ENV['APP_ENV'] = 'development';
    $_ENV['DB_HOST'] = 'localhost';
    $_ENV['DB_NAME'] = 'sumo';
    $_ENV['DB_USER'] = 'root';
    $_ENV['DB_PASS'] = '';
    $_ENV['DB_PORT'] = '3306';
    $_ENV['JWT_SECRET'] = 'your-secret-key-here';
    $_ENV['JWT_EXPIRY'] = '3600';
}

// CORS headers - Fixed for development
$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Handle CORS preflight early
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    exit;
}

// Enable or disable error reporting dynamically based on the environment
if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
    ini_set('display_errors', 1); // Show errors in development
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL); // Report all types of errors
} else {
    ini_set('display_errors', 0); // Hide errors in production
    ini_set('display_startup_errors', 0);
    error_reporting(0); // Suppress error reporting
}

// Define routes using FastRoute
$dispatcher = FastRoute\simpleDispatcher(function (FastRoute\RouteCollector $r) {
    // Route for POST requests to /api
    $r->addRoute('POST', '/api/{method}', [ApiController::class, 'handleRequest']);
    $r->addRoute('GET', '/api/{method}', [ApiController::class, 'handleRequest']);
});

// Fetch the current HTTP request method and URI
$httpMethod = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Remove the query string and decode the URI
if (false !== $pos = strpos($uri, '?')) {
    $uri = substr($uri, 0, $pos);
}
$uri = rawurldecode($uri);

$routeInfo = $dispatcher->dispatch($httpMethod, $uri);

try {
    switch ($routeInfo[0]) {
        case FastRoute\Dispatcher::NOT_FOUND:
            http_response_code(404);
            echo json_encode(['error' => '404 - Not Found']);
            break;

        case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
            http_response_code(405);
            echo json_encode(['error' => '405 - Method Not Allowed']);
            break;

        case FastRoute\Dispatcher::FOUND:
            $handler = $routeInfo[1];
            $vars = $routeInfo[2];

            $method = $vars['method']; // Extract method from URI without changing case
            [$class, $action] = $handler;

            //dependency initialization for services
            $autModel = new \App\Models\AuthModel();
            $userModel = new \App\Models\UserModel();
            $productModel = new \App\Models\ProductModel();

            $authConfig = require_once './Config/AuthConfig.php';

            // Manually create required dependencies
            $authService = new \App\Services\AuthService($autModel, $authConfig);
            $userService = new \App\Services\UserService($userModel, $authService);
            $productService = new \App\Services\ProductService($productModel, $authService, new \App\Models\CompanyModel());
            $companyService = new \App\Services\CompanyService(new \App\Models\CompanyModel(), $authService);
            $discountService = new \App\Services\DiscountService(new \App\Models\DiscountModel(), $authService, new \App\Models\CompanyModel());
            $analyticsService = new \App\Services\AnalyticsService(new \App\Models\AnalyticsModel(), $authService);

            // Create the instance of the controller with the required dependencies
            $controller = new $class($authService, $userService, $productService, $companyService, $discountService, $analyticsService);

            // Call the action with the method
            $controller->$action($method);
            break;

    }
} catch (ApiException $e) {
    // Handle custom `ApiException`
    http_response_code($e->getStatusCode());
    echo json_encode([
        'error_code' => $e->getErrorCode(),
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    // Handle all other unexpected errors
    http_response_code(500);
    if ($_ENV['APP_ENV'] === 'development') {
        // Show detailed error trace in development mode
        echo json_encode([
            'error' => 'Unexpected server error',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);
    } else {
        // Return a generic message in production
        echo json_encode([
            'error' => 'Internal server error',
            'message' => 'An error has occurred. Please try again later.',
        ]);
    }
}