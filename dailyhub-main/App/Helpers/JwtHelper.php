<?php
namespace App\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper
{
    private static array $config;

    private static function getConfig(): array
    {
        if (!isset(self::$config)) {
            self::$config = require __DIR__ . '/../../Config/AuthConfig.php';
        }
        return self::$config;
    }
    public static function generateToken($data): string
    {
        $payload = [
            'iss' => 'discount',       // Issuer
            'iat' => time(),               // Issued at
            'exp' => time() + self::getConfig()['jwt_expiration'], // Expiration
            'jti' => bin2hex(random_bytes(16)), // Token ID for revocation/auditing
            'data' => $data,               // Custom data (e.g., user info)
        ];

        $key = (string) self::getConfig()['jwt_secret_key'];
        if ($key === '' || $key === 'change-me') {
            throw new \RuntimeException('JWT secret not configured');
        }
        return JWT::encode($payload, $key, 'HS256');
    }

    public static function validateToken($token): ?\stdClass
    {

        try {
            $key = (string) self::getConfig()['jwt_secret_key'];
            if ($key === '' || $key === 'change-me') {
                return null;
            }
            return JWT::decode($token, new Key($key, 'HS256'));
        } catch (\Exception $e) {
            return null; // Or handle exception as necessary
        }
    }
}