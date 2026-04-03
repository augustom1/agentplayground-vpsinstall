#!/bin/sh
# Ollama entrypoint — starts the server then ensures all configured models are present.
set -e

echo "[ollama] Starting server..."
/bin/ollama serve &
OLLAMA_PID=$!

# Wait until the API is responding (up to 60 s)
i=0
until curl -sf http://localhost:11434/api/version > /dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[ollama] ERROR: server did not start within 60 s"
    exit 1
  fi
  sleep 1
done
echo "[ollama] Server ready."

# Pull each model — fast no-op if already present in the volume
for MODEL in $OLLAMA_AUTO_PULL; do
  echo "[ollama] Ensuring model: $MODEL"
  ollama pull "$MODEL"
done

echo "[ollama] All models ready."

# Hand off to the server process (keeps container alive)
wait $OLLAMA_PID
