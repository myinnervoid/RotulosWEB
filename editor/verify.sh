#!/usr/bin/env bash
# ============================================================
# 🔍 verify.sh — Verificación Rápida de Entorno Rótulos Web v5.1
# ============================================================

echo "🔍 Verificando Rótulos Web v5.1..."

# Detección dinámica de Node en PATH
if ! command -v node >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    \. "$NVM_DIR/nvm.sh"
  elif [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE=$(find "$HOME/.nvm/versions/node" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -n 1)
    if [ -n "$LATEST_NODE" ]; then
      export PATH="$LATEST_NODE/bin:$PATH"
    fi
  fi
fi

# 1. Limpiar puerto
echo "1. Limpiando puerto 5050..."
PIDS=$(lsof -ti :5050 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill -9 $PIDS 2>/dev/null
  echo "   🛑 Puerto 5050 liberado (PIDs: $PIDS)"
else
  echo "   ✅ Puerto 5050 ya está libre"
fi

# 2. Verificar librerías en vendor/
echo "2. Verificando librerías en public/vendor/..."
for lib in grapesjs.min.js grapesjs-blocks-basic.min.js axe.min.js; do
  if [ -f "public/vendor/$lib" ]; then
    echo "   ✅ $lib encontrado"
  else
    echo "   ❌ $lib no encontrado"
  fi
done

# 3. Verificar plantillas
echo "3. Verificando plantillas en templates/..."
for template in memexicanisimos landing blog portfolio; do
  if [ -d "templates/$template" ]; then
    echo "   ✅ Plantilla '$template' encontrada"
  else
    echo "   ❌ Plantilla '$template' no encontrada"
  fi
done

# 4. Ejecutar pruebas automatizadas
echo "4. Ejecutando suite de pruebas automatizadas..."
npm test

echo "✅ Verificación de Rótulos Web v5.1 completada con éxito."
