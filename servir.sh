#!/usr/bin/env bash
# Servidor provisional para probar el sitio en local.
#
# El Worker ya está desplegado y config.js apunta a la URL real, así que
# alcanza con servir archivos estáticos: no hace falta levantar wrangler dev.
#
#   ./servir.sh            -> http://127.0.0.1:8000
#   ./servir.sh 8080       -> http://127.0.0.1:8080
#
# Ctrl+C para cortar.

set -euo pipefail

PUERTO="${1:-8000}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Falta python3. Instalalo o usá cualquier otro servidor estático." >&2
  exit 1
fi

if ss -ltn 2>/dev/null | grep -q ":${PUERTO}\b"; then
  echo "El puerto ${PUERTO} ya está ocupado. Probá con: ./servir.sh $((PUERTO + 1))" >&2
  exit 1
fi

echo "Sirviendo ${RAIZ}"
echo "  sitio:    http://127.0.0.1:${PUERTO}/"
echo "  cédulas:  http://127.0.0.1:${PUERTO}/tools/dni-checker/index.html"
echo "  Ctrl+C para cortar"
echo

exec python3 -m http.server "$PUERTO" --bind 127.0.0.1 --directory "$RAIZ"
