<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\UserModel;

class UserService
{
    private UserModel $userModel;
    private AuthService $authService;

    public function __construct(UserModel $userModel, AuthService $authService)
    {
        $this->userModel = $userModel;
        $this->authService = $authService;
    }

    /**
     * @throws ApiException
     */
    public function registerUser(array $data): array
    {

        if (empty($data['username']) || empty($data['name']) || empty($data['email']) || empty($data['mobile']) || empty($data['password']) || empty($data['type'])) {
            throw new ApiException(400, 'BAD_REQUEST', 'Missing required registration fields');
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(400, 'INVALID_EMAIL', 'The provided email is invalid');
        }

        if (
            strlen($data['password']) < 8 ||
            !preg_match('/[A-Z]/', $data['password']) ||
            !preg_match('/[a-z]/', $data['password']) ||
            !preg_match('/\d/', $data['password']) ||
            !preg_match('/[\W_]/', $data['password'])
        ) {
            throw new ApiException(400, 'WEAK_PASSWORD', 'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character');
        }

        $userExist = $this->userModel->findUserByMailOrNumber($data['email'], $data['mobile']);
        if (isset($userExist['id'])) throw new ApiException(400, 'USER_ALREADY_EXISTS', 'User already exists');

        $userId = $this->userModel->register($data);

        if (!$userId) throw new ApiException(500, 'INTERNAL_SERVER_ERROR', 'Failed to register user');

        $this->authService->sendOtp($data['mobile']);

        // Get the created user data
        $createdUser = $this->userModel->findUserByMailOrNumber($data['email'], $data['mobile']);
        
        return [
            'status' => 'success', 
            'user_id' => $userId,
            'user' => [
                'id' => $createdUser['id'],
                'identifier' => $createdUser['email'] ?? $createdUser['mobile'],
                'role' => $createdUser['user_type']
            ]
        ];
    }


    /**
     * @throws ApiException
     */
    public function checkUserCredentials(array $data): array
    {
        //add jwt token, google auth, fb auth
        $this->validateCredentialsInput($data);

        $username = $data['username'];

        // Check limit and validate the user
        $limitCheck = $this->userModel->checkLimit($username);
        $this->handleLimitCheckErrors($limitCheck);

        $user = $this->userModel->findByUsername($username);
        if (!$user || !password_verify($data['password'], $user['password'])) {
            throw new ApiException(400, 'INVALID_CREDENTIALS', 'Invalid username or password');
        }

        $this->userModel->resetLimit($username);

        unset($user['password']);
        return ['user' => $user];
    }



    //add user register
    //get user info
    //1. **`login_user`**
    //1. **`create_jwt`**
    //1. **`validate_jwt`**
    //1. **`logout_user`**
    //1. **`handle_google_callback`**
    //1. **`handle_facebook_callback`**
    //1. **`require_auth`**
    //1. **`is_token_blacklisted`**
    //1. **`refresh_jwt`**

    /**
     * @throws ApiException
     */
    private function validateCredentialsInput(array $data): void
    {
        if (!isset($data['username'], $data['password']) || strlen($data['username'] . $data['password']) > 155) {
            throw new ApiException(400, 'BAD_REQUEST', 'Invalid credentials input');
        }
    }

    /**
     * @throws ApiException
     */
    private function handleLimitCheckErrors(int $check): void
    {
        $errorMapping = [
            '-5' => ['GENERAL_ERROR', 'General error occurred'],
            '-1' => ['TOO_MANY_TRIES', 'Too many attempts'],
        ];

        if (isset($errorMapping[$check])) {
            [$code, $message] = $errorMapping[$check];
            throw new ApiException(400, $code, $message);
        }
    }
}