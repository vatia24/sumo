<?php
declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $conn = null;

    public static function connection(): PDO
    {
        if (self::$conn) {
            return self::$conn;
        }
        $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $port = (int)($_ENV['DB_PORT'] ?? 3306);
        $db = $_ENV['DB_NAME'] ?? ($_ENV['DB_DATABASE'] ?? 'sumo');
        $user = $_ENV['DB_USER'] ?? ($_ENV['DB_USERNAME'] ?? 'root');
        $pass = $_ENV['DB_PASS'] ?? ($_ENV['DB_PASSWORD'] ?? '');
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $options = [
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        try {
            self::$conn = new PDO($dsn, $user, $pass, $options);
            return self::$conn;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'DB connection failed']);
            exit;
        }
    }
}

?>


