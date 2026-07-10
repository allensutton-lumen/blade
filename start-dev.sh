#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTART=false
BACKEND_PID=""
for arg in "$@"; do case "$arg" in --restart) RESTART=true ;; *) echo "Usage: ./start-dev.sh [--restart]" >&2; exit 1 ;; esac; done
log(){ printf '[start-dev] %s
' "$*"; }
die(){ printf '[start-dev] [error] %s
' "$*" >&2; exit 1; }
kill_port(){ local port="$1"; local pids; pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"; if [[ -n "$pids" ]]; then kill -TERM $pids 2>/dev/null || true; fi }
cleanup(){ if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then kill -TERM "$BACKEND_PID" 2>/dev/null || true; fi }
trap cleanup EXIT INT TERM
[[ -f "$ROOT_DIR/.env" ]] && set -a && source "$ROOT_DIR/.env" && set +a
if [[ "$RESTART" == "true" ]]; then kill_port 3001; fi
kill_port 5173
backend_ok=false
if [[ "$RESTART" == "false" ]] && curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then backend_ok=true; fi
if [[ "$backend_ok" == "false" ]]; then cd "$ROOT_DIR/backend"; [[ -d node_modules ]] || npm install; npm run dev & BACKEND_PID=$!; fi
for _ in $(seq 1 35); do if curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then break; fi; sleep 1; done
curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1 || die "Backend did not become healthy"
cd "$ROOT_DIR/frontend"; [[ -d node_modules ]] || npm install; npm run dev
