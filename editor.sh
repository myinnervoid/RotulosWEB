#!/usr/bin/env bash
# ==========================================================
# 🇲🇽 GESTOR UNIFICADO DEL ESTUDIO VISUAL MEMEXICANISIMOS
# Uso: ./editor.sh [start | stop | restart | status]
# ==========================================================
export PATH="/home/myinnervoid/.nvm/versions/node/v24.18.0/bin:$PATH"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EDITOR_DIR="$DIR/editor"
PORT=5050

function get_pid() {
  lsof -ti tcp:$PORT -sTCP:LISTEN 2>/dev/null
}

function stop_server() {
  local pids=$(get_pid)
  if [ -n "$pids" ]; then
    echo "🛑 Deteniendo Rótulos Web en puerto $PORT (PID: $pids)..."
    for p in $pids; do
      kill "$p" 2>/dev/null
    done
    sleep 1
    for p in $pids; do
      if kill -0 "$p" 2>/dev/null; then
        kill -9 "$p" 2>/dev/null
      fi
    done
    echo "✅ Servidor detenido y puerto $PORT liberado con éxito."
  else
    echo "ℹ️ No se detectó ningún servidor escuchando en el puerto $PORT."
  fi
}

function start_server() {
  local target_path="${1:-}"
  local pid=$(get_pid)
  if [ -n "$pid" ]; then
    echo "⚠️ Ya existe un servidor activo en puerto $PORT (PID: $pid)."
    echo "💡 Puedes usar './editor.sh restart' para reiniciarlo con los cambios más recientes."
    return 0
  fi

  if [ -n "$target_path" ]; then
    if [ ! -d "$target_path" ]; then
      echo "❌ La ruta '$target_path' no existe o no es un directorio válido."
      exit 1
    fi
    export PROJECT_PATH="$(cd "$target_path" && pwd)"
  fi

  echo "----------------------------------------------------------"
  echo "🛠️ Iniciando Rótulos Web (Estudio Visual Universal)..."
  if [ -n "$PROJECT_PATH" ]; then
    echo "📂 Proyecto activo: $PROJECT_PATH"
  else
    echo "📂 Proyecto activo: Raíz del repositorio actual"
  fi
  echo "🌐 Disponible en: http://localhost:$PORT"
  echo "💡 Comandos útiles:"
  echo "   - Detener:   ./editor.sh stop"
  echo "   - Reiniciar: ./editor.sh restart [ruta-opcional]"
  echo "   - Estado:    ./editor.sh status"
  echo "----------------------------------------------------------"

  cd "$EDITOR_DIR" || exit 1
  exec node server.js "$PROJECT_PATH"
}

function restart_server() {
  local target_path="${1:-}"
  echo "----------------------------------------------------------"
  echo "🔄 Aplicando reinicio completo del Estudio Visual..."
  stop_server
  sleep 1
  start_server "$target_path"
}

function status_server() {
  echo "----------------------------------------------------------"
  local pid=$(get_pid)
  if [ -n "$pid" ]; then
    echo "🟢 Estado: ACTIVO (Escuchando en http://localhost:$PORT)"
    echo "📌 PID: $pid"
    ps -p "$pid" -o pid,vsz,rss,%cpu,%mem,cmd 2>/dev/null
  else
    echo "🔴 Estado: DETENIDO (Puerto $PORT libre y sin procesos)."
  fi
  echo "----------------------------------------------------------"
}

function build_assets() {
  echo "----------------------------------------------------------"
  echo "📦 Compilando bundles de producción en $EDITOR_DIR..."
  cd "$EDITOR_DIR" || exit 1
  npm run build
  echo "✅ Bundles (app.min.js y style.min.css) compilados exitosamente."
  echo "----------------------------------------------------------"
}

ACTION="${1:-start}"
PROJECT_ARG="${2:-}"

case "$ACTION" in
  start)
    start_server "$PROJECT_ARG"
    ;;
  stop)
    stop_server
    ;;
  restart)
    restart_server "$PROJECT_ARG"
    ;;
  status)
    status_server
    ;;
  build)
    build_assets
    ;;
  *)
    echo "🛠️ Talachas y Rótulos Web – Gestor Universal"
    echo "Uso: $0 [start | stop | restart | status | build] [ruta-del-proyecto]"
    exit 1
    ;;
esac
