<?php

$creds = [
    ['root', ''],
    ['root', 'root'],
    ['u276379167_nexora', 'c$2+iaxy3F#'],
];

foreach ($creds as [$user, $pass]) {
    try {
        $pdo = new PDO('mysql:host=127.0.0.1;port=3306', $user, $pass);
        echo "OK user={$user}\n";
    } catch (Throwable $e) {
        echo "FAIL user={$user}: {$e->getMessage()}\n";
    }
}
