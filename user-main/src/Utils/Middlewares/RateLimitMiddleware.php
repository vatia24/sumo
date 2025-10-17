<?php
declare(strict_types=1);

namespace App\Utils\Middlewares;

use App\Utils\Request;
use App\Utils\Response;
use App\Utils\RateLimiter;

final class RateLimitMiddleware implements Middleware
{
    public function __construct(
        private Request $request,
        private Response $response,
        private RateLimiter $rateLimiter
    ) {
    }

    public function handle(): bool
    {
        $ip = $this->request->server['REMOTE_ADDR'] ?? 'unknown';
        $path = $this->request->server['REQUEST_URI'] ?? '/';
        $key = $ip . '|' . $path;
        if ($this->rateLimiter->tooManyAttempts($key, 20, 60)) {
            $this->response->json(['error' => 'Too Many Requests'], 429);
            return false;
        }
        return true;
    }
}


