<?php
declare(strict_types=1);

namespace App\Utils;

use Dotenv\Dotenv;

final class DotEnv
{
    public static function load(string $basePath): void
    {
        $envPath = $basePath . DIRECTORY_SEPARATOR . '.env';
        if (is_file($envPath)) {
            $dotenv = Dotenv::createImmutable($basePath);
            $dotenv->safeLoad();
        } else {
            $dotenv = Dotenv::createImmutable($basePath, '.env.example');
            $dotenv->safeLoad();
        }
    }
}


