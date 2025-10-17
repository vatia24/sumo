<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\DiscountRepository;
use App\Repositories\StoreRepository;

final class SiteContextService
{
    public function buildContext(): string
    {
        $siteName = (string)($_ENV['SITE_NAME'] ?? 'Our Website');
        $siteUrl = (string)($_ENV['SITE_URL'] ?? 'http://localhost:8001');
        $sitePurpose = (string)($_ENV['SITE_PURPOSE'] ?? 'A discount and deals platform for users.');
        $safety = (string)($_ENV['AI_SAFETY_POLICY'] ?? 'Do not reveal confidential, internal, or personally identifiable information.');
        $siteCountry = (string)($_ENV['SITE_COUNTRY'] ?? '');
        $siteCurrency = (string)($_ENV['SITE_CURRENCY'] ?? '');
        $sitePositioning = (string)($_ENV['SITE_POSITIONING'] ?? '');

        $productsSummary = $this->buildProductsSummary();

        $parts = [];
        $parts[] = "Site: {$siteName}";
        $parts[] = "URL: {$siteUrl}";
        $parts[] = "Purpose: {$sitePurpose}";
        $parts[] = "Safety: {$safety}";
        if ($siteCountry !== '') { $parts[] = "Country: {$siteCountry}"; }
        if ($siteCurrency !== '') { $parts[] = "Currency: {$siteCurrency}"; }
        if ($sitePositioning !== '') { $parts[] = "Positioning: {$sitePositioning}"; }
        if ($productsSummary !== '') {
            $parts[] = "Sample Products/Discounts (JSON):\n" . $productsSummary;
        }

        return implode("\n", $parts);
    }

    private function buildProductsSummary(): string
    {
        $repo = new DiscountRepository();
        $result = $repo->list([], 10, null);
        $items = $result['items'] ?? [];
        $trimmed = [];
        foreach ($items as $row) {
            $trimmed[] = [
                'id' => $row['id'] ?? null,
                'title' => $row['title'] ?? ($row['product_name'] ?? null),
                'product_name' => $row['product_name'] ?? null,
                'product_price' => $row['product_price'] ?? null,
                'discount_percent' => $row['discount_percent'] ?? null,
                'start_date' => $row['start_date'] ?? null,
                'end_date' => $row['end_date'] ?? null,
            ];
        }
        if (!$trimmed) {
            return '';
        }
        return json_encode($trimmed, JSON_UNESCAPED_SLASHES);
    }
}



