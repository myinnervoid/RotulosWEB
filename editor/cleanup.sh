#!/usr/bin/env bash
# ============================================================
# 🛑 cleanup.sh — Limpieza de Procesos en Puerto 5050
# Rótulos Web / Memexicanísimos Studio v5.1
# ============================================================

PORT=5050

# Detectar PIDs ocupando el puerto
PIDS=$(lsof -ti :$PORT 2>/dev/null)

if [ -n "$PIDS" ]; then
  echo "🛑 Deteniendo procesos huérfanos en puerto $PORT (PIDs: $PIDS)..."
  kill -9 $PIDS 2>/dev/null
  sleep 1
  echo "✅ Puerto $PORT liberado con éxito."
else
  echo "✅ Puerto $PORT ya se encuentra libre."
fi
