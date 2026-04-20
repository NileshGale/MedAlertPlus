<?php
function scan($dir) {
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        if (is_dir($path)) {
            if ($file === '.git' || $file === 'tmp') continue;
            scan($path);
        } elseif (preg_match('/\.php$/', $file)) {
            $content = @file_get_contents($path);
            if ($content === false) continue;
            if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
                echo "BOM: $path\n";
            }
            if (preg_match('/^\s/', $content)) {
                echo "Leading WS: $path\n";
            }
            if (strpos($content, '?>') !== false) {
                $last = strrpos($content, '?>');
                $after = substr($content, $last + 2);
                if (strlen($after) > 0 && trim($after) === '') {
                    echo "Trailing WS: $path [" . bin2hex($after) . "]\n";
                }
            }
        }
    }
}
scan('.');
