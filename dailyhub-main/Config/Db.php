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
        // Load environment variables once (outside the Db class, ideally in your bootstrap)
        static $dotenv = null;
        if ($dotenv === null) {
            $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
            $dotenv->load();
        }

        if (!self::$instance) {
            try {
                self::$instance = new PDO(
                    sprintf(
                        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                        $_ENV['DB_HOST'],
                        $_ENV['DB_PORT'] ?? 3306,
                        $_ENV['DB_NAME']
                    ),
                    $_ENV['DB_USER'],
                    $_ENV['DB_PASS'],
                    [
                        PDO::ATTR_PERSISTENT => true, // Use persistent connections
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_EMULATE_PREPARES => false, // Use native prepared statements
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
//class Db
//{
//    private static ?PDO $instance = null;
//
//    public static function getInstance(): PDO
//    {
//
//        $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
//        $dotenv->load();
//
//        if (!self::$instance) {
//            try {
//                self::$instance = new PDO(
//                    sprintf(
//                        'mysql:host=%s;dbname=%s;charset=utf8mb4',
//                        $_ENV['DB_HOST'],
//                        $_ENV['DB_NAME']
//                    ),
//                    $_ENV['DB_USER'],
//                    $_ENV['DB_PASS']
//                );
//                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
//            } catch (PDOException $e) {
//                throw new PDOException('Could not connect to the database. Please try again later. '.$e->getMessage());
//            }
//        }
//        return self::$instance;
//    }
//}