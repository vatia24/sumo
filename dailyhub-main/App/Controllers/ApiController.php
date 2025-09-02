<?php

namespace App\Controllers;

use App\Exceptions\ApiException;
use App\Helpers\JwtHelper;
use App\Services\AuthService;
use App\Services\UserService;
use App\Services\ProductService;
use App\Helpers\ResponseHelper;
use App\Services\CompanyService;
use App\Services\DiscountService;
use App\Services\AnalyticsService;

class ApiController
{
    private AuthService $authService;
    private UserService $userService;
    private ProductService $productService;
    private CompanyService $companyService;
    private DiscountService $discountService;
    private AnalyticsService $analyticsService;

    public function __construct(AuthService $authService, UserService $userService, ProductService $productService, CompanyService $companyService, DiscountService $discountService, AnalyticsService $analyticsService)
    {
        $this->authService = $authService;
        $this->userService = $userService;
        $this->productService = $productService;
        $this->companyService = $companyService;
        $this->discountService = $discountService;
        $this->analyticsService = $analyticsService;
    }

    public function handleRequest(string $method): void
    {
        try {
            // Define a mapping for method handlers
            $methodMap = $this->getMethodMap();

            // Check if the method exists in the mapping
            if (!array_key_exists($method, $methodMap)) {
                throw new ApiException(400, 'INVALID_METHOD', 'The requested method is not valid.');
            }

            // Route the request to appropriate handler
            $response = $this->routeRequest($method, $methodMap);

            // Send a successful response
            ResponseHelper::response(200, 'SUCCESS', $response);
        } catch (ApiException $e) {
            // Handle known API exceptions
            ResponseHelper::response($e->getStatusCode(), $e->getErrorCode(), $e->getMessage());
        } catch (\Throwable $e) {
            // Handle unexpected errors
            ResponseHelper::response(500,
                'INTERNAL_SERVER_ERROR',
                ['message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace(),]);
        }
    }

    /**
     * Defines valid API methods and their corresponding handlers.
     *
     * This mapping is used for both GET and POST requests.
     * @return array<string, callable>
     */
    private function getMethodMap(): array
    {
        return [
            // Auth: login + account lifecycle
            // POST /api/authorize { identifier, password }
            'authorize'                 => [$this->authService, 'authorize'],
            // POST /api/registerUser { username, name, email, mobile, password, type }
            'registerUser'              => [$this->userService, 'registerUser'],
            // POST /api/verifyCustomer { mobile, otp }
            'verifyCustomer'            => [$this->authService, 'verifyAndActivateUser'],
            // POST /api/logout (Bearer token)
            'logout'                    => [$this->authService, 'logout'],
            // Password reset
            // POST /api/requestPasswordReset { identifier }
            'requestPasswordReset'      => [$this->authService, 'requestPasswordReset'],
            // POST /api/confirmPasswordReset { identifier, otp, new_password }
            'confirmPasswordReset'      => [$this->authService, 'confirmPasswordReset'],
            // Social OAuth callbacks (GET)
            'facebookAuth'              => [$this->authService, 'facebookAuth'],
            'googleAuth'                => [$this->authService, 'googleAuth'],
            // Token refresh (POST)
            'refresh'                   => [$this->authService, 'refresh'],

            // Products: read-only quick list with discounts (legacy)
            // GET /api/getProducts[?id=]
            'getProducts'               => [$this->productService, 'getProducts'],
            // GET /api/getProductsWithDiscounts[?id=]
            'getProductsWithDiscounts' => [$this->productService, 'getProducts'],
            // GET /api/getProduct?id=
            'getProduct'                => [$this->productService, 'getProduct'],
            // Products: full management (RBAC Owner/Manager)
            // GET /api/listProducts?company_id&status&q&limit&offset
            'listProducts'              => [$this->productService, 'list'],
            // POST /api/upsertProduct { id?, company_id, name, price, status, ... }
            'upsertProduct'             => [$this->productService, 'upsert'],
            // POST /api/deleteProduct { id }
            'deleteProduct'             => [$this->productService, 'delete'],
            // POST /api/bulkProductStatus { ids[], status }
            'bulkProductStatus'         => [$this->productService, 'bulkStatus'],
            // Product images
            // POST /api/addProductImage { product_id, file_base64 }
            'addProductImage'           => [$this->productService, 'addImage'],
            // GET /api/listProductImages?product_id
            'listProductImages'         => [$this->productService, 'listImages'],
            // POST /api/deleteProductImage { image_id }
            'deleteProductImage'        => [$this->productService, 'deleteImage'],

            // Company: profile + RBAC
            // POST /api/upsertCompany { id?, full_name, address, ... }
            'upsertCompany'             => [$this->companyService, 'upsertCompany'],
            // GET /api/getCompany?id
            'getCompany'                => [$this->companyService, 'getCompany'],
            // GET /api/getUserCompany (Bearer token)
            'getUserCompany'            => [$this->companyService, 'getUserCompany'],
            // POST /api/setCompanyStatus { company_id, status }
            'setCompanyStatus'          => [$this->companyService, 'setStatus'],
            // Hours
            // POST /api/setCompanyHours { company_id, hours:[{day_of_week,open_time,close_time,is_closed}] }
            'setCompanyHours'           => [$this->companyService, 'setHours'],
            // GET /api/getCompanyHours?company_id
            'getCompanyHours'           => [$this->companyService, 'getHours'],
            // Socials
            // POST /api/addCompanySocial { company_id, platform, url }
            'addCompanySocial'          => [$this->companyService, 'addSocial'],
            // GET /api/listCompanySocials?company_id
            'listCompanySocials'        => [$this->companyService, 'listSocials'],
            // POST /api/deleteCompanySocial { company_id, id }
            'deleteCompanySocial'       => [$this->companyService, 'deleteSocial'],
            // Gallery
            // POST /api/addCompanyGallery { company_id, file_base64 }
            'addCompanyGallery'         => [$this->companyService, 'addGallery'],
            // GET /api/listCompanyGallery?company_id
            'listCompanyGallery'        => [$this->companyService, 'listGallery'],
            // POST /api/deleteCompanyGallery { company_id, id }
            'deleteCompanyGallery'      => [$this->companyService, 'deleteGallery'],
            // Documents (verification)
            // POST /api/addCompanyDocument { company_id, doc_type, file_base64 }
            'addCompanyDocument'        => [$this->companyService, 'addDocument'],
            // GET /api/listCompanyDocuments?company_id
            'listCompanyDocuments'      => [$this->companyService, 'listDocuments'],
            // POST /api/reviewCompanyDocument { company_id, id, status }
            'reviewCompanyDocument'     => [$this->companyService, 'reviewDocument'],
            // POST /api/deleteCompanyDocument { company_id, id }
            'deleteCompanyDocument'     => [$this->companyService, 'deleteDocument'],
            // Delivery zones
            // POST /api/upsertDeliveryZone { id?, company_id, name, zone_type, center_lat, center_lng, radius_m, polygon }
            'upsertDeliveryZone'        => [$this->companyService, 'upsertZone'],
            // GET /api/listDeliveryZones?company_id
            'listDeliveryZones'         => [$this->companyService, 'listZones'],
            // POST /api/deleteDeliveryZone { company_id, id }
            'deleteDeliveryZone'        => [$this->companyService, 'deleteZone'],

            // Branches
            // POST /api/upsertBranch { id?, company_id, branch_name, branch_address, branch_image }
            'upsertBranch'              => [$this->companyService, 'upsertBranch'],
            // GET /api/listBranches?company_id
            'listBranches'              => [$this->companyService, 'listBranches'],
            // POST /api/deleteBranch { company_id, id }
            'deleteBranch'              => [$this->companyService, 'deleteBranch'],

            // Contacts
            // POST /api/addContact { company_id, phone?, email?, address? }
            'addContact'                => [$this->companyService, 'addContact'],
            // GET /api/listContacts?company_id
            'listContacts'              => [$this->companyService, 'listContacts'],
            // POST /api/deleteContact { company_id, id }
            'deleteContact'             => [$this->companyService, 'deleteContact'],

            // Discounts
            // GET /api/listDiscounts
            'listDiscounts'             => [$this->discountService, 'list'],
            // POST /api/upsertDiscount { id?, company_id, product_id, ... }
            'upsertDiscount'            => [$this->discountService, 'upsert'],
            // POST /api/bulkDiscountStatus { ids[], status }
            'bulkDiscountStatus'        => [$this->discountService, 'bulkStatus'],

            // Analytics
            // POST /api/trackAction { discount_id, action, ... }
            'trackAction'               => [$this->analyticsService, 'track'],
            // GET /api/analyticsSummary?discount_id
            'analyticsSummary'          => [$this->analyticsService, 'summary'],
            // GET /api/topDiscounts?action&limit
            'topDiscounts'              => [$this->analyticsService, 'top'],
        ];
    }

    /**
     * Routes request to the appropriate handler based on method and request type.
     *
     * @param string $method
     * @param array<string, callable> $methodMap
     * @return mixed
     * @throws ApiException
     */
    private function routeRequest(string $method, array $methodMap): mixed
    {
        $requestType = $_SERVER['REQUEST_METHOD'];
        //var_dump($requestType);

        if ($requestType === 'POST') {
            $body = $this->getJsonInput();
            return call_user_func($methodMap[$method], $body);
        }

        if ($requestType === 'GET') {
            $queryParams = $_GET;
            return call_user_func($methodMap[$method], $queryParams);
        }

        throw new ApiException(405, 'METHOD_NOT_ALLOWED', 'Only GET and POST methods are supported.');
    }

    /**
     * Extracts the method requested from the URL.
     *
     * @return string|null
     */
    private function extractMethodFromUrl(): ?string
    {
        $parts = parse_url($_SERVER['REQUEST_URI']);
        $path = trim($parts['path'], '/');
        $segments = explode('/', $path);

        // Find the 'api' segment
        $apiIndex = array_search('api', $segments);

        // If 'api' segment is found and there's a next segment, return it
        if ($apiIndex !== false && isset($segments[$apiIndex + 1])) {
            return $segments[$apiIndex + 1];
        }

        return null;
    }


    /**
     * Parses the JSON input and trims all fields recursively.
     *
     * @return array
     * @throws ApiException
     */
    private function getJsonInput(): array
    {
        // Retrieve raw input data
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate JSON
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ApiException(400, 'BAD_REQUEST', 'Invalid JSON input. Please check the syntax.');
        }

        return $this->trimRecursive($input);
    }

    /**
     * Recursively trim all values in an array or string.
     *
     * @param mixed $input
     * @return mixed
     */
    private function trimRecursive(mixed $input): mixed
    {
        if (is_array($input)) {
            return array_map([$this, 'trimRecursive'], $input);
        }

        if (is_string($input)) {
            return trim($input);
        }

        return $input;
    }

}