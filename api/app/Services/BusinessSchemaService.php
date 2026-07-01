<?php

namespace App\Services;

class BusinessSchemaService
{
    public function getSchemaDescription(): string
    {
        return <<<'SCHEMA'
Tabelas disponíveis (MySQL):

1) regions
   - id INT PK AUTO_INCREMENT
   - name VARCHAR (ex: Sul, Sudeste)
   - code VARCHAR (ex: SUL, SE)

2) products
   - id INT PK AUTO_INCREMENT
   - name VARCHAR
   - category VARCHAR (commercial, marketing, finance, hr, operations, other)
   - unit_price DECIMAL(12,2)

3) customers
   - id INT PK AUTO_INCREMENT
   - name VARCHAR
   - segment VARCHAR (geral, enterprise, pme)
   - region_id INT FK -> regions.id

4) sales
   - id INT PK AUTO_INCREMENT
   - sale_date DATE (YYYY-MM-DD)
   - customer_id INT FK -> customers.id
   - product_id INT FK -> products.id
   - region_id INT FK -> regions.id
   - quantity INT
   - unit_price DECIMAL(12,2)
   - total_amount DECIMAL(12,2) (valor total da venda)
   - seller_name VARCHAR

Relacionamentos:
- sales.region_id -> regions.id
- sales.product_id -> products.id
- sales.customer_id -> customers.id
- customers.region_id -> regions.id

Use JOINs quando precisar de nomes legíveis (região, produto, cliente).

Sintaxe SQL: MySQL 8. Use DATE_SUB(CURDATE(), INTERVAL 3 MONTH) para últimos 3 meses.
Para agrupar por mês: DATE_FORMAT(sale_date, '%Y-%m') AS mes. Não use strftime nem date('now').
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
