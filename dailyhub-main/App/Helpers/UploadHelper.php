<?php

namespace App\Helpers;

class UploadHelper
{
    public static function saveBase64(string $base64, string $directory, ?string $filename = null): string
    {
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        if (!str_contains($base64, ',')) {
            throw new \InvalidArgumentException('Invalid base64 payload');
        }

        [$meta, $data] = explode(',', $base64, 2);
        $extension = 'bin';
        if (preg_match('/data\/(.+);base64/', $meta, $m)) {
            $mime = $m[1];
            $map = [
                'png' => 'png', 'jpeg' => 'jpg', 'jpg' => 'jpg', 'gif' => 'gif', 'pdf' => 'pdf',
                'mp4' => 'mp4', 'webm' => 'webm'
            ];
            $extension = $map[$mime] ?? $mime;
        }

        $name = $filename ?: (uniqid('upl_', true) . '.' . $extension);
        $path = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $name;
        file_put_contents($path, base64_decode($data));
        return $path;
    }
}


