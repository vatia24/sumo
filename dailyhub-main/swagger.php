<?php

require __DIR__ . '/vendor/autoload.php';

use OpenApi\Generator;

// Scan your codebase for OpenAPI annotations
$openapi = Generator::scan([__DIR__ . '/App']);

// Output the documentation as JSON
header('Content-Type: application/json');
echo $openapi->toJson();