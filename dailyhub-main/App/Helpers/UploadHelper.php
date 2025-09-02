<?php

namespace App\Helpers;

class UploadHelper
{
    public static function saveBase64(string $base64, string $directory, ?string $filename = null, int $maxBytes = 5_000_000): string
    {
        if (!is_dir($directory)) {
            // 0750 prevents world-read, adjust per deployment umask
            mkdir($directory, 0750, true);
        }

        if (!str_contains($base64, ',')) {
            throw new \InvalidArgumentException('Invalid base64 payload');
        }

        [$meta, $data] = explode(',', $base64, 2);

        // Decode base64
        $binary = base64_decode($data, true);
        if ($binary === false) {
            throw new \InvalidArgumentException('Invalid base64 payload');
        }
        if (strlen($binary) > $maxBytes) {
            throw new \InvalidArgumentException('File too large');
        }

        // Detect mime using finfo on decoded content
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->buffer($binary) ?: '';
        $detectedMime = strtolower($detectedMime);

        $allowed = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/gif' => 'gif',
            'application/pdf' => 'pdf',
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
        ];

        // If metadata is present, parse but trust finfo result for enforcement
        $metaMime = null;
        if (preg_match('/data:([^;]+);base64/', $meta, $m)) {
            $metaMime = strtolower($m[1]);
        }

        if (!isset($allowed[$detectedMime])) {
            throw new \InvalidArgumentException('Unsupported mime type');
        }

        // If meta mime present and mismatches detection, reject
        if ($metaMime !== null && $metaMime !== $detectedMime) {
            throw new \InvalidArgumentException('Mime type mismatch');
        }

        $extension = $allowed[$detectedMime];

        // Sanitize provided filename to avoid traversal; otherwise generate random
        if ($filename !== null) {
            $filename = basename($filename);
            // Enforce expected extension
            $filename = preg_replace('/\.[^.]*$/', '', $filename) . '.' . $extension;
        }

        $name = $filename ?: (bin2hex(random_bytes(8)) . '.' . $extension);
        $path = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $name;

        // Write file atomically
        if (file_put_contents($path, $binary, LOCK_EX) === false) {
            throw new \RuntimeException('Failed to write uploaded file');
        }
        // Restrict permissions
        @chmod($path, 0640);

        return $path;
    }
}


