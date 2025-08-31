<?php
// Simple test to check if the API routing is working
echo "Testing API routing...<br>";

// Check if we can access the API controller
if (file_exists('App/Controllers/ApiController.php')) {
    echo "✅ ApiController.php exists<br>";
} else {
    echo "❌ ApiController.php not found<br>";
}

// Check if autoloader exists
if (file_exists('vendor/autoload.php')) {
    echo "✅ Autoloader exists<br>";
} else {
    echo "❌ Autoloader not found<br>";
}

// Check if .env file exists
if (file_exists('.env')) {
    echo "✅ .env file exists<br>";
} else {
    echo "❌ .env file not found<br>";
}

// Test if we can include the main index.php
echo "<br>Testing main index.php...<br>";
try {
    // Capture output to see what happens
    ob_start();
    include 'index.php';
    $output = ob_get_clean();
    echo "✅ index.php loaded successfully<br>";
    echo "Output length: " . strlen($output) . " characters<br>";
} catch (Exception $e) {
    echo "❌ Error loading index.php: " . $e->getMessage() . "<br>";
}
?>
