<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Repositories\UserRepository;
use App\Utils\JwtService;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

final class AuthController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function register(): void
    {
        $name = Validator::requiredString($this->req->body, 'name', 2, 80);
        $email = Validator::email($this->req->body, 'email');
        $password = Validator::requiredString($this->req->body, 'password', 6, 128);
        if (!$name || !$email || !$password) {
            $this->res->json(['error' => 'Invalid input'], 422);
            return;
        }
        $auth = new AuthService();
        $result = $auth->register($name, $email, $password);
        if (isset($result['error'])) {
            $this->res->json(['error' => $result['error']], 409);
            return;
        }
        $this->res->json(['userId' => $result['userId'], 'tokens' => $result['tokens']], 201);
    }

    public function login(): void
    {
        $email = Validator::email($this->req->body, 'email');
        $password = Validator::requiredString($this->req->body, 'password', 6, 128);
        if (!$email || !$password) {
            $this->res->json(['error' => 'Invalid input'], 422);
            return;
        }
        $auth = new AuthService();
        $result = $auth->login($email, $password);
        if (!$result) {
            $this->res->json(['error' => 'Invalid credentials'], 401);
            return;
        }
        $this->res->json($result);
    }

    public function refresh(): void
    {
        $token = $this->req->body['refreshToken'] ?? null;
        if (!$token) {
            $this->res->json(['error' => 'Invalid token'], 422);
            return;
        }
        $jwt = new JwtService();
        $payload = $jwt->verify($token, 'refresh');
        if (!$payload) {
            $this->res->json(['error' => 'Invalid token'], 401);
            return;
        }
        $tokens = $jwt->generateTokens((int)$payload['sub']);
        $this->res->json($tokens);
    }

    public function me(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        if ($userId <= 0) {
            $this->res->json(['error' => 'Unauthorized'], 401);
            return;
        }
        $repo = new UserRepository();
        $user = $repo->findById($userId);
        if (!$user) {
            $this->res->json(['error' => 'Not found'], 404);
            return;
        }
        $this->res->json(['user' => $user]);
    }
}


