<?php

$_SERVER['HTTP_HOST'] = 'localhost';
include_once __DIR__ . '/../settings/includes.php';

$pdo = getConexaoDB1();
if (!$pdo) {
    fwrite(STDERR, (getLastDbConnectionError() ?? 'DB FAIL') . PHP_EOL);
    exit(1);
}

$pdo->beginTransaction();

$regions = [
    ['Sudeste', 'SE'],
    ['Sul', 'SUL'],
    ['Nordeste', 'NE'],
    ['Centro-Oeste', 'CO'],
    ['Norte', 'N'],
];
$regionStmt = $pdo->prepare(
    'INSERT INTO regions (name, code, created_at)
     SELECT :name, :code, NOW()
     WHERE NOT EXISTS (SELECT 1 FROM regions WHERE code = :code2)'
);
foreach ($regions as $region) {
    $regionStmt->execute([
        'name' => $region[0],
        'code' => $region[1],
        'code2' => $region[1],
    ]);
}

$products = [
    ['Plano Analytics Pro', 'software', 890],
    ['Consultoria de BI', 'servicos', 4500],
    ['Licença Dashboard Extra', 'software', 190],
    ['Treinamento da equipe', 'servicos', 1200],
    ['Pacote Relatórios IA', 'software', 320],
];
$productStmt = $pdo->prepare(
    'INSERT INTO products (name, category, unit_price, created_at)
     SELECT :name, :category, :price, NOW()
     WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = :name2)'
);
foreach ($products as $product) {
    $productStmt->execute([
        'name' => $product[0],
        'category' => $product[1],
        'price' => $product[2],
        'name2' => $product[0],
    ]);
}

$customers = [
    ['Acme Indústria', 'industria', 'SE'],
    ['Mercado Horizonte', 'varejo', 'SUL'],
    ['Clínica Aurora', 'saude', 'NE'],
    ['Agro Campo Verde', 'agronegocio', 'CO'],
    ['Logística Norte', 'logistica', 'N'],
    ['Tech Paulista', 'tecnologia', 'SE'],
];
$customerStmt = $pdo->prepare(
    'INSERT INTO customers (name, segment, region_id, created_at)
     SELECT :name, :segment, r.id, NOW()
     FROM regions r
     WHERE r.code = :code
       AND NOT EXISTS (SELECT 1 FROM customers WHERE name = :name2)'
);
foreach ($customers as $customer) {
    $customerStmt->execute([
        'name' => $customer[0],
        'segment' => $customer[1],
        'code' => $customer[2],
        'name2' => $customer[0],
    ]);
}

$regionIds = [];
foreach ($pdo->query('SELECT id, code FROM regions') as $row) {
    $regionIds[$row['code']] = (int) $row['id'];
}
$productRows = $pdo->query('SELECT id, unit_price FROM products ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
$customerRows = $pdo->query(
    'SELECT c.id, c.region_id FROM customers c ORDER BY c.id'
)->fetchAll(PDO::FETCH_ASSOC);
$sellers = ['Ana Souza', 'Bruno Lima', 'Carla Nunes', 'Diego Alves', 'Elisa Prado'];

$existingSales = (int) $pdo->query('SELECT COUNT(*) FROM sales')->fetchColumn();
if ($existingSales === 0 && $productRows && $customerRows) {
    $insertSale = $pdo->prepare(
        'INSERT INTO sales (
            sale_date, customer_id, product_id, region_id, quantity, unit_price, total_amount, seller_name, created_at
        ) VALUES (
            :sale_date, :customer_id, :product_id, :region_id, :quantity, :unit_price, :total_amount, :seller_name, NOW()
        )'
    );

    $start = new DateTimeImmutable('first day of this month');
    $start = $start->modify('-5 months');
    for ($month = 0; $month < 6; $month++) {
        $monthDate = $start->modify("+{$month} months");
        $daysInMonth = (int) $monthDate->format('t');
        $salesThisMonth = 18 + ($month % 5);
        for ($n = 0; $n < $salesThisMonth; $n++) {
            $day = 1 + (($n * 3) % $daysInMonth);
            $customer = $customerRows[$n % count($customerRows)];
            $product = $productRows[$n % count($productRows)];
            $qty = 1 + ($n % 4);
            $unit = (float) $product['unit_price'];
            $insertSale->execute([
                'sale_date' => $monthDate->format('Y-m-') . str_pad((string) $day, 2, '0', STR_PAD_LEFT),
                'customer_id' => (int) $customer['id'],
                'product_id' => (int) $product['id'],
                'region_id' => (int) $customer['region_id'],
                'quantity' => $qty,
                'unit_price' => $unit,
                'total_amount' => round($qty * $unit, 2),
                'seller_name' => $sellers[$n % count($sellers)],
            ]);
        }
    }
}

$pdo->commit();

echo 'regions=' . $pdo->query('SELECT COUNT(*) FROM regions')->fetchColumn() . PHP_EOL;
echo 'products=' . $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn() . PHP_EOL;
echo 'customers=' . $pdo->query('SELECT COUNT(*) FROM customers')->fetchColumn() . PHP_EOL;
echo 'sales=' . $pdo->query('SELECT COUNT(*) FROM sales')->fetchColumn() . PHP_EOL;
echo 'OK' . PHP_EOL;
