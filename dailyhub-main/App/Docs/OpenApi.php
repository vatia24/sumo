<?php

namespace App\Docs;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="DailyHub API",
 *     version="1.0.0",
 *     description="API for authentication, users, products, discounts, and analytics"
 * )
 *
 * @OA\Server(
 *     url="/",
 *     description="Current origin"
 * )
 */
class OpenApi
{
}

/**
 * @OA\Post(
 *     path="/api/authorize",
 *     summary="Authorize user and get JWT token",
 *     tags={"auth"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"identifier","password"},
 *             @OA\Property(property="identifier", type="string"),
 *             @OA\Property(property="password", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Authorized",
 *         @OA\JsonContent(
 *             @OA\Property(property="statusCode", type="integer"),
 *             @OA\Property(property="type", type="string"),
 *             @OA\Property(property="data", type="object",
 *                 @OA\Property(property="token", type="string")
 *             )
 *         )
 *     ),
 *     @OA\Response(response=401, description="Invalid credentials")
 * )
 */
class AuthPaths
{
}

/**
 * @OA\Post(
 *     path="/api/registerUser",
 *     summary="Register a new user and send OTP",
 *     tags={"auth"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"username","name","email","mobile","password","type"},
 *             @OA\Property(property="username", type="string"),
 *             @OA\Property(property="name", type="string"),
 *             @OA\Property(property="email", type="string", format="email"),
 *             @OA\Property(property="mobile", type="string"),
 *             @OA\Property(property="password", type="string", format="password"),
 *             @OA\Property(property="type", type="string", example="customer")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Registered",
 *         @OA\JsonContent(
 *             @OA\Property(property="statusCode", type="integer"),
 *             @OA\Property(property="type", type="string"),
 *             @OA\Property(property="data", type="object",
 *                 @OA\Property(property="status", type="string"),
 *                 @OA\Property(property="user_id", type="integer")
 *             )
 *         )
 *     ),
 *     @OA\Response(response=400, description="Validation error")
 * )
 */
class RegisterPaths
{
}

/**
 * @OA\Post(
 *     path="/api/verifyCustomer",
 *     summary="Verify OTP and activate user",
 *     tags={"auth"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"mobile","otp"},
 *             @OA\Property(property="mobile", type="string"),
 *             @OA\Property(property="otp", type="integer")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Verified"),
 *     @OA\Response(response=400, description="Invalid OTP")
 * )
 */
class VerifyPaths
{
}

/**
 * @OA\Get(
 *     path="/api/facebookAuth",
 *     summary="Facebook OAuth callback",
 *     tags={"auth"},
 *     @OA\Parameter(name="code", in="query", required=true, @OA\Schema(type="string")),
 *     @OA\Response(response=200, description="OK"),
 *     @OA\Response(response=401, description="Cannot authorize")
 * )
 */
class FacebookAuthPaths
{
}

/**
 * @OA\Get(
 *     path="/api/googleAuth",
 *     summary="Google OAuth callback",
 *     tags={"auth"},
 *     @OA\Parameter(name="code", in="query", required=true, @OA\Schema(type="string")),
 *     @OA\Response(response=200, description="OK"),
 *     @OA\Response(response=401, description="Cannot authorize")
 * )
 */
class GoogleAuthPaths
{
}

/**
 * @OA\Post(
 *     path="/api/logout",
 *     summary="Logout (invalidate access token)",
 *     tags={"auth"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Response(response=200, description="OK")
 * )
 */
class LogoutPaths
{
}

/**
 * @OA\Post(
 *     path="/api/requestPasswordReset",
 *     summary="Request password reset code",
 *     tags={"auth"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"identifier"},
 *             @OA\Property(property="identifier", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Sent")
 * )
 */
class PasswordResetRequestPaths
{
}

/**
 * @OA\Post(
 *     path="/api/confirmPasswordReset",
 *     summary="Confirm password reset with code",
 *     tags={"auth"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"identifier","otp","new_password"},
 *             @OA\Property(property="identifier", type="string"),
 *             @OA\Property(property="otp", type="integer"),
 *             @OA\Property(property="new_password", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Reset")
 * )
 */
class PasswordResetConfirmPaths
{
}

/**
 * @OA\Get(
 *     path="/api/getProducts",
 *     summary="Get products (requires Bearer token)",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductPaths
{
}

/**
 * @OA\Get(
 *     path="/api/getProduct",
 *     summary="Get a single product by id with active discount",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="id", in="query", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="OK"),
 *     @OA\Response(response=400, description="Bad request"),
 *     @OA\Response(response=404, description="Not found")
 * )
 */
class ProductGetPaths{}

/**
 * @OA\Get(
 *     path="/api/listProducts",
 *     summary="List products with filters",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="company_id", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="branch_id", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="q", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="limit", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="offset", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductListPaths{}

/**
 * @OA\Post(
 *     path="/api/upsertProduct",
 *     summary="Create or update product (Owner/Manager)",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"company_id","name","price","status"},
 *             @OA\Property(property="id", type="integer"),
 *             @OA\Property(property="company_id", type="integer"),
 *             @OA\Property(property="branch_id", type="integer"),
 *             @OA\Property(property="name", type="string"),
 *             @OA\Property(property="description", type="string"),
 *             @OA\Property(property="price", type="number", format="float"),
 *             @OA\Property(property="image_url", type="string"),
 *             @OA\Property(property="link", type="string"),
 *             @OA\Property(property="address", type="string"),
 *             @OA\Property(property="status", type="string", enum={"draft","active","inactive","archived","scheduled"})
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductUpsertPaths{}

/**
 * @OA\Post(
 *     path="/api/deleteProduct",
 *     summary="Delete product (Owner/Manager)",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"id"},
 *             @OA\Property(property="id", type="integer")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductDeletePaths{}

/**
 * @OA\Post(
 *     path="/api/bulkProductStatus",
 *     summary="Bulk set product status",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"ids","status"},
 *             @OA\Property(property="ids", type="array", @OA\Items(type="integer")),
 *             @OA\Property(property="status", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductBulkStatusPaths{}

/**
 * @OA\Post(
 *     path="/api/addProductImage",
 *     summary="Upload product image (base64)",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"product_id","file_base64"},
 *             @OA\Property(property="product_id", type="integer"),
 *             @OA\Property(property="file_base64", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductImageAddPaths{}

/**
 * @OA\Get(
 *     path="/api/listProductImages",
 *     summary="List product images",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="product_id", in="query", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductImagesListPaths{}

/**
 * @OA\Post(
 *     path="/api/deleteProductImage",
 *     summary="Delete product image",
 *     tags={"products"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"image_id"},
 *             @OA\Property(property="image_id", type="integer")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class ProductImageDeletePaths{}

/**
 * @OA\Post(
 *     path="/api/upsertCompany",
 *     summary="Create or update company",
 *     tags={"company"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             @OA\Property(property="id", type="integer"),
 *             @OA\Property(property="full_name", type="string"),
 *             @OA\Property(property="address", type="string"),
 *             @OA\Property(property="city", type="string"),
 *             @OA\Property(property="postal_code", type="string"),
 *             @OA\Property(property="country", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class CompanyUpsertPaths{}

/**
 * @OA\Get(
 *     path="/api/getCompany",
 *     summary="Get company by id",
 *     tags={"company"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="id", in="query", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class CompanyGetPaths{}

/**
 * @OA\Get(
 *     path="/api/listDiscounts",
 *     summary="List discounts",
 *     tags={"discounts"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="company_id", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="product_id", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="active_only", in="query", required=false, @OA\Schema(type="boolean")),
 *     @OA\Parameter(name="from_date", in="query", required=false, @OA\Schema(type="string", format="date")),
 *     @OA\Parameter(name="to_date", in="query", required=false, @OA\Schema(type="string", format="date")),
 *     @OA\Parameter(name="limit", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="offset", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class DiscountsListPaths{}

/**
 * @OA\Post(
 *     path="/api/upsertDiscount",
 *     summary="Create or update discount",
 *     tags={"discounts"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"company_id","product_id","status"},
 *             @OA\Property(property="id", type="integer"),
 *             @OA\Property(property="company_id", type="integer"),
 *             @OA\Property(property="product_id", type="integer"),
 *             @OA\Property(property="discount_price", type="number", format="float"),
 *             @OA\Property(property="discount_percent", type="number", format="float"),
 *             @OA\Property(property="start_date", type="string", format="date"),
 *             @OA\Property(property="end_date", type="string", format="date"),
 *             @OA\Property(property="status", type="string", enum={"draft","active","inactive","archived","scheduled"})
 *         )
 *     ),
 *     @OA\Response(response=400, description="Provide either discount_price or discount_percent"),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class DiscountsUpsertPaths{}

/**
 * @OA\Post(
 *     path="/api/bulkDiscountStatus",
 *     summary="Bulk change discount status",
 *     tags={"discounts"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"ids","status"},
 *             @OA\Property(property="ids", type="array", @OA\Items(type="integer")),
 *             @OA\Property(property="status", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class DiscountsBulkStatusPaths{}

/**
 * @OA\Post(
 *     path="/api/trackAction",
 *     summary="Track analytics action",
 *     tags={"analytics"},
 *     security={{"bearerAuth": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"discount_id","action"},
 *             @OA\Property(property="discount_id", type="integer"),
 *             @OA\Property(property="action", type="string", enum={"view","clicked","redirect","map_open","share","favorite"}),
 *             @OA\Property(property="device_type", type="string", enum={"mobile","desktop","tablet"}),
 *             @OA\Property(property="city", type="string"),
 *             @OA\Property(property="region", type="string"),
 *             @OA\Property(property="age_group", type="string"),
 *             @OA\Property(property="gender", type="string")
 *         )
 *     ),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class AnalyticsTrackPaths{}

/**
 * @OA\Get(
 *     path="/api/analyticsSummary",
 *     summary="Get analytics summary for a discount",
 *     tags={"analytics"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="discount_id", in="query", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="from", in="query", required=false, @OA\Schema(type="string", format="date-time")),
 *     @OA\Parameter(name="to", in="query", required=false, @OA\Schema(type="string", format="date-time")),
 *     @OA\Parameter(name="device_type", in="query", required=false, @OA\Schema(type="string", enum={"mobile","desktop","tablet"})),
 *     @OA\Parameter(name="city", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="region", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="age_group", in="query", required=false, @OA\Schema(type="string", enum={"under_18","18_24","25_34","35_44","45_54","55_64","65_plus"})),
 *     @OA\Parameter(name="gender", in="query", required=false, @OA\Schema(type="string", enum={"male","female","other","unknown"})),
 *     @OA\Parameter(name="granularity", in="query", required=false, @OA\Schema(type="string", enum={"day","week","month"})),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class AnalyticsSummaryPaths{}

/**
 * @OA\Get(
 *     path="/api/topDiscounts",
 *     summary="Top discounts by action",
 *     tags={"analytics"},
 *     security={{"bearerAuth": {}}},
 *     @OA\Parameter(name="action", in="query", required=false, @OA\Schema(type="string", enum={"view","clicked","redirect","map_open","share","favorite"})),
 *     @OA\Parameter(name="limit", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="company_id", in="query", required=false, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="from", in="query", required=false, @OA\Schema(type="string", format="date-time")),
 *     @OA\Parameter(name="to", in="query", required=false, @OA\Schema(type="string", format="date-time")),
 *     @OA\Parameter(name="device_type", in="query", required=false, @OA\Schema(type="string", enum={"mobile","desktop","tablet"})),
 *     @OA\Parameter(name="city", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="region", in="query", required=false, @OA\Schema(type="string")),
 *     @OA\Parameter(name="age_group", in="query", required=false, @OA\Schema(type="string", enum={"under_18","18_24","25_34","35_44","45_54","55_64","65_plus"})),
 *     @OA\Parameter(name="gender", in="query", required=false, @OA\Schema(type="string", enum={"male","female","other","unknown"})),
 *     @OA\Response(response=200, description="OK")
 * )
 */
class AnalyticsTopPaths{}

/**
 * @OA\Components(
 *     securitySchemes={
 *         @OA\SecurityScheme(
 *             securityScheme="bearerAuth",
 *             type="http",
 *             scheme="bearer",
 *             bearerFormat="JWT"
 *         )
 *     }
 * )
 */
class Components
{
}


