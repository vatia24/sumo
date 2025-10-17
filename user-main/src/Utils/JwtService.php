<?php
declare(strict_types=1);

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    private string $secret;
    private string $issuer;
    private int $accessTtl;
    private int $refreshTtl;

    public function __construct()
    {
        $this->secret = $_ENV['JWT_SECRET'] ?? 'changeme';
        $this->issuer = $_ENV['JWT_ISSUER'] ?? 'dailyhub-user-main';
        $this->accessTtl = (int)($_ENV['ACCESS_TOKEN_TTL'] ?? 900);
        $this->refreshTtl = (int)($_ENV['REFRESH_TOKEN_TTL'] ?? 1209600);
    }

    public function generateTokens(int $userId): array
    {
        $now = time();
        $access = [
            'iss' => $this->issuer,
            'sub' => $userId,
            'iat' => $now,
            'exp' => $now + $this->accessTtl,
            'type' => 'access',
        ];
        $refresh = [
            'iss' => $this->issuer,
            'sub' => $userId,
            'iat' => $now,
            'exp' => $now + $this->refreshTtl,
            'type' => 'refresh',
        ];

        return [
            'accessToken' => JWT::encode($access, $this->secret, 'HS256'),
            'refreshToken' => JWT::encode($refresh, $this->secret, 'HS256'),
        ];
    }

    public function verify(string $token, string $type = 'access'): ?array
    {
        try {
            $decoded = (array)JWT::decode($token, new Key($this->secret, 'HS256'));
            if (($decoded['type'] ?? '') !== $type) {
                return null;
            }
            return $decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }
}


