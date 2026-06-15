<?php

namespace App\Services;

class BusinessSchemaService
{
    public function getSchemaDescription(): string
    {
        return <<<'SCHEMA'
Tabelas disponíveis (SQLite):

1) regions
   - id INTEGER PK
   - name TEXT (ex: Sul, Sudeste)
   - code TEXT (ex: SUL, SE)

2) products
   - id INTEGER PK
   - name TEXT
   - category TEXT (commercial, marketing, finance, hr, operations, other)
   - unit_price REAL

3) customers
   - id INTEGER PK
   - name TEXT
   - segment TEXT (geral, enterprise, pme)
   - region_id INTEGER FK -> regions.id

4) sales
   - id INTEGER PK
   - sale_date TEXT (YYYY-MM-DD)
   - customer_id INTEGER FK -> customers.id
   - product_id INTEGER FK -> products.id
   - region_id INTEGER FK -> regions.id
   - quantity INTEGER
   - unit_price REAL
   - total_amount REAL (valor total da venda)
   - seller_name TEXT

Relacionamentos:
- sales.region_id -> regions.id
- sales.product_id -> products.id
- sales.customer_id -> customers.id
- customers.region_id -> regions.id

Use JOINs quando precisar de nomes legíveis (região, produto, cliente).
SCHEMA;
    }

    /**
     * @return string[]
     */
    public function getAllowedTables(): array
    {
        return ['regions', 'products', 'customers', 'sales'];
    }
}
