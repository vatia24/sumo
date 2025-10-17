<?php

namespace App\Helpers;

class ResponseHelper
{
    public static function response(int $status, string $type, $data = []): void
    {
        header('Content-Type: application/json; charset=utf-8', true, $status);
        $payload = json_encode(['statusCode' => $status, 'type' => $type, 'data' => $data]);

        // Compute ETag for client validation
        $etag = 'W/"' . sha1($payload) . '"';
        header('ETag: ' . $etag);

        // If client already has this content, short-circuit
        $ifNone = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
        if ($ifNone === $etag && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
            http_response_code(304);
            exit;
        }

        // Enable gzip/deflate if zlib.output_compression is off and client accepts it
        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        $canGzip = function_exists('gzencode') && strpos($acceptEncoding, 'gzip') !== false;
        if ($canGzip) {
            header('Content-Encoding: gzip');
            // 6 is a good trade-off for speed/size
            echo gzencode($payload, 6);
        } else {
            echo $payload;
        }
        exit;
    }

}

