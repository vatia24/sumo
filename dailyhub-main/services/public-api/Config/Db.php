<?php

namespace Config;

use PDO;
use PDOException;
use Dotenv\Dotenv;

class Db
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        static $dotenv = null;
        if ($dotenv === null) {
            $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
            $dotenv->safeLoad();
        }
        if (!self::$instance) {
            try {
                $host = $_ENV['DB_HOST'] ?? null;
                $name = $_ENV['DB_NAME'] ?? null;
                $user = $_ENV['DB_USER'] ?? null;
                if (!$host || !$name || !$user) {
                    throw new PDOException('Database not configured: set DB_HOST, DB_NAME, DB_USER (and DB_PASS if needed) in .env');
                }
                self::$instance = new PDO(
                    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, (int)($_ENV['DB_PORT'] ?? 3306), $name),
                    $user,
                    $_ENV['DB_PASS'] ?? '',
                    [
                        PDO::ATTR_PERSISTENT => true,
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]
                );
            } catch (PDOException $e) {
                throw new PDOException('Database connection failed: ' . $e->getMessage());
            }
        }
        return self::$instance;
    }
}

