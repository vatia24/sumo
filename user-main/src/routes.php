<?php

use App\Controllers\AuthController;
use App\Controllers\DiscountsController;
use App\Controllers\UsersController;
use App\Controllers\StoresController;
use App\Controllers\CommentsController;
use App\Controllers\ChallengesController;
use App\Controllers\FavoritesController;
use App\Controllers\SwaggerController;
use App\Controllers\ActionsController;
use App\Controllers\HealthController;
use App\Controllers\SearchController;
use App\Controllers\CategoriesController;
use App\Controllers\NotificationsController;
use App\Controllers\GamificationController;
use App\Controllers\ChatController;
use App\Utils\Router;
use App\Utils\Middlewares\AuthMiddleware;
use App\Utils\Middlewares\RateLimitMiddleware;

return function (Router $router): void {
    // Health
    $router->get('/api/health', [HealthController::class, 'health']);
    // Auth
    $router->post('/api/auth/register', [AuthController::class, 'register'], [RateLimitMiddleware::class]);
    $router->post('/api/auth/login', [AuthController::class, 'login'], [RateLimitMiddleware::class]);
    $router->post('/api/auth/refresh', [AuthController::class, 'refresh'], [RateLimitMiddleware::class]);
    $router->get('/api/users/me', [AuthController::class, 'me'], [AuthMiddleware::class]);
    $router->patch('/api/users/me', [UsersController::class, 'updateMe'], [AuthMiddleware::class]);
    $router->post('/api/users/me/location', [UsersController::class, 'updateLocation'], [AuthMiddleware::class]);
    $router->get('/api/users/:id/achievements', [UsersController::class, 'achievements']);

    // Users (achievements delegated to actions service)
    // $router->get('/api/users/:id/achievements', [...]);

    // Stores
    $router->get('/api/stores', [StoresController::class, 'index']);
    $router->get('/api/stores/:id', [StoresController::class, 'show']);
    $router->get('/api/search', [SearchController::class, 'index']);
    $router->get('/api/categories', [CategoriesController::class, 'index']);
    $router->get('/api/categories/tree', [CategoriesController::class, 'tree']);
    $router->get('/api/categories/roots', [CategoriesController::class, 'roots']);

    // Discounts
    $router->get('/api/discounts', [DiscountsController::class, 'index']);
    $router->get('/api/discounts/:id', [DiscountsController::class, 'show']);
    $router->post('/api/discounts/:id/view', [DiscountsController::class, 'view']);

    // Comments
    $router->post('/api/discounts/:id/comments', [CommentsController::class, 'create'], [AuthMiddleware::class]);
    $router->get('/api/discounts/:id/comments', [CommentsController::class, 'list']);

    // Favorites
    $router->post('/api/discounts/:id/favorite', [FavoritesController::class, 'create'], [AuthMiddleware::class]);
    $router->delete('/api/discounts/:id/favorite', [FavoritesController::class, 'delete'], [AuthMiddleware::class]);
    $router->get('/api/users/me/favorites', [FavoritesController::class, 'list'], [AuthMiddleware::class]);
    $router->get('/api/notifications', [NotificationsController::class, 'index'], [AuthMiddleware::class]);

    // Actions / Gamification
    $router->post('/api/actions/perform', [ActionsController::class, 'perform'], [AuthMiddleware::class]);
    $router->get('/api/users/me/points-history', [ActionsController::class, 'history'], [AuthMiddleware::class]);
    $router->get('/api/users/me/badges', [ActionsController::class, 'badges'], [AuthMiddleware::class]);
    $router->get('/api/leaderboard', [ActionsController::class, 'leaderboard']);
    $router->post('/api/gamification/spin-wheel', [GamificationController::class, 'spin'], [AuthMiddleware::class]);

    // Challenges
    $router->get('/api/challenges/active', [ChallengesController::class, 'active']);
    $router->post('/api/challenges/:id/complete', [ChallengesController::class, 'complete'], [AuthMiddleware::class]);

    // AI Chat
    $router->post('/api/chat', [ChatController::class, 'chat'], [RateLimitMiddleware::class]);
    $router->post('/api/chat/sessions', [ChatController::class, 'createSession'], [AuthMiddleware::class]);
    $router->get('/api/chat/sessions', [ChatController::class, 'listSessions'], [AuthMiddleware::class]);
    $router->get('/api/chat/sessions/:sessionKey/messages', [ChatController::class, 'getMessages'], [AuthMiddleware::class]);
    $router->delete('/api/chat/sessions/:sessionKey', [ChatController::class, 'deleteSession'], [AuthMiddleware::class]);

    // Swagger
    $router->get('/', [SwaggerController::class, 'ui']);
    $router->get('/swagger', [SwaggerController::class, 'ui']);
    $router->get('/swagger.yaml', [SwaggerController::class, 'spec']);
};

