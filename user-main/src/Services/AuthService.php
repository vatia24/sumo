<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\UserRepository;
use App\Utils\JwtService;

final class AuthService
{
    public function __construct(private UserRepository $users = new UserRepository())
    {
    }

    public function register(string $name, string $email, string $password): array
    {
        // For centralized system: dailyhub-main likely handles registration. For now, return error.
        return ['error' => 'Registration is handled by merchant system'];
    }

    public function login(string $emailOrUsername, string $password): ?array
    {
        // Try username first, then email
        $user = $this->users->findByUsername($emailOrUsername) ?? $this->users->findByEmail($emailOrUsername);
        if (!$user) {
            return null;
        }
        // dailyhub-main uses Argon2id generally for passwords
        $valid = password_verify($password, $user['password'] ?? $user['password_hash'] ?? '');
        if (!$valid) {
            return null;
        }
        $this->users->createProfileIfMissing((int)$user['id']);
        $me = $this->users->findById((int)$user['id']);
        $jwt = new JwtService();
        $tokens = $jwt->generateTokens((int)$user['id']);
        return [
            'user' => [
                'id' => (int)$me['id'],
                'name' => $me['name'] ?? $me['username'] ?? null,
                'email' => $me['email'] ?? null,
                'photo_url' => $me['photo_url'] ?? null,
                'points' => (int)($me['points'] ?? 0),
                'level' => (int)($me['level'] ?? 1),
            ],
            'tokens' => $tokens,
        ];
    }
}


