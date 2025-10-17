<?php
declare(strict_types=1);

namespace App\Utils;

use App\Utils\Middlewares\Middleware;

final class Router
{
    private array $routes = [];

    public function __construct(
        private Request $request,
        private Response $response,
        private RateLimiter $rateLimiter
    ) {
    }

    public function get(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('POST', $path, $handler, $middlewares);
    }

    public function patch(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('PATCH', $path, $handler, $middlewares);
    }

    public function delete(string $path, array $handler, array $middlewares = []): void
    {
        $this->add('DELETE', $path, $handler, $middlewares);
    }

    private function add(string $method, string $path, array $handler, array $middlewares): void
    {
        $this->routes[] = ['m' => $method, 'p' => $path, 'h' => $handler, 'mw' => $middlewares];
    }

    public function dispatch(): void
    {
        $method = $this->request->server['REQUEST_METHOD'] ?? 'GET';
        $uri = parse_url($this->request->server['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        foreach ($this->routes as $r) {
            if ($method !== $r['m']) {
                continue;
            }
            $pattern = '#^' . preg_replace('#:([a-zA-Z_][a-zA-Z0-9_]*)#', '(?P<$1>[^/]+)', $r['p']) . '$#';
            if (preg_match($pattern, $uri, $matches)) {
                $this->request->params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                foreach ($r['mw'] as $mwClass) {
                    /** @var Middleware $mw */
                    $mw = new $mwClass($this->request, $this->response, $this->rateLimiter);
                    if ($mw->handle() === false) {
                        return;
                    }
                }

                [$class, $methodName] = $r['h'];
                $controller = new $class($this->request, $this->response);
                $controller->$methodName($this->request->params);
                return;
            }
        }
        $this->response->json(['error' => 'Not Found'], 404);
    }
}


