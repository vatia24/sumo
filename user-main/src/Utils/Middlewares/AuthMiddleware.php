<?php
declare(strict_types=1);

namespace App\Utils\Middlewares;

use App\Utils\Request;
use App\Utils\Response;
use App\Utils\RateLimiter;
use App\Utils\JwtService;

final class AuthMiddleware implements Middleware
{
    public function __construct(
        private Request $request,
        private Response $response,
        private RateLimiter $rateLimiter
    ) {
    }

    public function handle(): bool
    {
        $token = $this->request->bearerToken();
        if (!$token) {
            $this->response->json(['error' => 'Unauthorized'], 401);
            return false;
        }
        $jwt = new JwtService();
        $payload = $jwt->verify($token, 'access');
        if (!$payload) {
            $this->response->json(['error' => 'Unauthorized'], 401);
            return false;
        }
        $this->request->params['authUserId'] = (int)$payload['sub'];
        return true;
    }
}


