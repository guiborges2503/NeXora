#!/usr/bin/env bash
# =============================================================================
# Recria o banco LOCAL de testes nexora_test com a massa fictícia.
#
# Uso (Git Bash no Windows ou Linux/CI):
#   bash scripts/reset-test-db.sh
#
# Variáveis opcionais:
#   MYSQL_BIN        caminho do cliente mysql (padrão: detecta o WAMP ou usa "mysql")
#   MYSQL_ROOT_USER  usuário administrador (padrão: root)
#   MYSQL_ROOT_PASS  senha do administrador (padrão: vazia, padrão do WAMP)
#   MYSQL_HOST       host (padrão: 127.0.0.1)
#   MYSQL_PORT       porta (padrão: 3306)
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${MYSQL_BIN:-}" ]]; then
  WAMP_MYSQL="$(ls -d /c/wamp64/bin/mysql/mysql*/bin/mysql.exe 2>/dev/null | sort -V | tail -1 || true)"
  if [[ -n "$WAMP_MYSQL" ]]; then
    MYSQL_BIN="$WAMP_MYSQL"
  else
    MYSQL_BIN="mysql"
  fi
fi

MYSQL_ROOT_USER="${MYSQL_ROOT_USER:-root}"
MYSQL_ROOT_PASS="${MYSQL_ROOT_PASS:-}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

run_sql() {
  local db="$1" file="$2"
  echo "  -> $(basename "$file")"
  MYSQL_PWD="$MYSQL_ROOT_PASS" "$MYSQL_BIN" \
    --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_ROOT_USER" \
    --default-character-set=utf8mb4 ${db:+"$db"} < "$file"
}

echo "Recriando banco nexora_test em $MYSQL_HOST:$MYSQL_PORT ..."
run_sql ""            "$ROOT_DIR/database/test/00_create_database.sql"
run_sql "nexora_test" "$ROOT_DIR/database/install_mysql.sql"
run_sql "nexora_test" "$ROOT_DIR/database/scripts/seed_admin.sql"
run_sql "nexora_test" "$ROOT_DIR/database/test/seed_test_data.sql"

echo "Conferência da massa de dados:"
MYSQL_PWD="$MYSQL_ROOT_PASS" "$MYSQL_BIN" \
  --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_ROOT_USER" nexora_test -e "
SELECT
  (SELECT COUNT(*) FROM users)      AS users,
  (SELECT COUNT(*) FROM regions)    AS regions,
  (SELECT COUNT(*) FROM products)   AS products,
  (SELECT COUNT(*) FROM customers)  AS customers,
  (SELECT COUNT(*) FROM sales)      AS sales,
  (SELECT COUNT(*) FROM dashboards) AS dashboards;"

echo "OK - banco nexora_test pronto."
