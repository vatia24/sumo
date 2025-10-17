<?php
declare(strict_types=1);

namespace App\Utils;

final class Validator
{
    public static function requiredString(array $data, string $key, int $min = 1, int $max = 255): ?string
    {
        $value = trim((string)($data[$key] ?? ''));
        if (strlen($value) < $min || strlen($value) > $max) {
            return null;
        }
        return $value;
    }

    public static function email(array $data, string $key): ?string
    {
        $value = filter_var((string)($data[$key] ?? ''), FILTER_VALIDATE_EMAIL);
        return $value ?: null;
    }

    public static function int(array $data, string $key, ?int $min = null, ?int $max = null): ?int
    {
        if (!isset($data[$key]) || !is_numeric($data[$key])) {
            return null;
        }
        $val = (int)$data[$key];
        if ($min !== null && $val < $min) return null;
        if ($max !== null && $val > $max) return null;
        return $val;
    }
}


