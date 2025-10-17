<?php
declare(strict_types=1);

namespace App\Utils;

final class Pagination
{
    public static function encodeCursor(?string $cursor): ?string
    {
        if ($cursor === null) {
            return null;
        }
        return rtrim(strtr(base64_encode($cursor), '+/', '-_'), '=');
    }

    public static function decodeCursor(?string $cursor): ?string
    {
        if ($cursor === null) {
            return null;
        }
        $b64 = strtr($cursor, '-_', '+/');
        $pad = strlen($b64) % 4;
        if ($pad) {
            $b64 .= str_repeat('=', 4 - $pad);
        }
        return base64_decode($b64) ?: null;
    }
}


