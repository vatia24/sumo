<?php

namespace App\Exceptions;

use Exception;

class ApiException extends Exception
{
    private int $statusCode;
    private string $errorCode;

    public function __construct(int $status, string $errorCode, string $message)
    {
        $this->statusCode = $status;
        $this->errorCode = $errorCode;
        parent::__construct($message);
    }

    // Getter for statusCode
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    // Getter for errorCode
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}