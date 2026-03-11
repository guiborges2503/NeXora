<?php
/**
 * Autoload para classes compartilhadas - Padrão Nortrek
 */
spl_autoload_register(function ($class) {
    $class = ltrim($class, '\\');

    if (strpos($class, 'Shared\\') === 0) {
        $relativeClass = substr($class, 7);
        $file = __DIR__ . '/' . str_replace('\\', '/', $relativeClass) . '.php';

        if (file_exists($file)) {
            require $file;
        }
    }
});
