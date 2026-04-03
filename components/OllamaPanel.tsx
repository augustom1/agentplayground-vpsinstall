"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, Download, CheckCircle2, XCircle, RefreshCw, ChevronDown } from "lucide-react";

type OllamaModel = {
  name: string;
  size: number;
  modified_at: string;
  details?: { parameter_size?: string; family?: string };
};

type PullStatus = {
  status: string;
  completed?: number;
  total?: number;
  error?: string;
};

const POPULAR_MODELS = [
  { name: "llama3.2", label: "Llama 3.2 (3B) — fast, small", size: "~2 GB" },
  { name: "llama3.1", label: "Llama 3.1 (8B) — balanced", size: "~5 GB" },
  { name: "mistral", label: "Mistral (7B) — great for code", size: "~4 GB" },
  { name: "gemma2", label: "Gemma 2 (9B) — Google", size: "~5 GB" },
  { name: "phi3", label: "Phi-3 (3.8B) — Microsoft, tiny", size: "~2 GB" },
  { name: "codellama", label: "CodeLlama (7B) — coding", size: "~4 GB" },
  { name: "qwen2.5", label: "Qwen 2.5 (7B) — multilingual", size: "~5 GB" },
  { name: "deepseek-r1", label: "DeepSeek-R1 (7B) — reasoning", size: "~5 GB" },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function OllamaPanel() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(POPULAR_MODELS[0].name);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<PullStatus | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ollama/models", { cache: "no-store" });
      const data = await res.json();
      setRunning(data.running ?? false);
      setModels(data.models ?? []);
      if (!data.running) setError(data.error ?? "Cannot connect to Ollama");
    } catch {
      setRunning(false);
      setError("Cannot connect to Ollama");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  async function pullModel(modelName: string) {
    if (pulling) return;
    setPulling(modelName);
    setPullStatus({ status: "Starting pull..." });

    try {
      const res = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });

      if (!res.ok) {
        setPullStatus({ status: "error", error: "Pull request failed" });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          try {
            const parsed: PullStatus = JSON.parse(line);
            setPullStatus(parsed);
          } catch {}
        }
      }

      await fetchModels();
    } catch (err) {
      setPullStatus({ status: "error", error: String(err) });
    } finally {
      setPulling(null);
    }
  }

  async function deleteModel(name: string) {
    if (deleting) return;
    setDeleting(name);
    try {
      await fetch("/api/ollama/models", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await fetchModels();
    } finally {
      setDeleting(null);
    }
  }

  const pullProgress =
    pullStatus?.total && pullStatus?.completed
      ? Math.round((pullStatus.completed / pullStatus.total) * 100)
      : null;

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            Ollama — Local Models
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "var(--color-muted)" }} />
          ) : running ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={13} style={{ color: "var(--color-green)" }} />
              <span className="text-[11px]" style={{ color: "var(--color-green)" }}>Running</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle size={13} style={{ color: "var(--color-red)" }} />
              <span className="text-[11px]" style={{ color: "var(--color-red)" }}>Not running</span>
            </div>
          )}
          <button onClick={fetchModels} className="btn-ghost p-1.5" title="Refresh">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {!running && !loading && (
        <div className="px-3 py-2.5 rounded-lg text-[12px]" style={{ background: "var(--color-red-dim)", color: "var(--color-red)" }}>
          {error ?? "Ollama is not running."} Start it with <code className="text-[11px]">docker compose up ollama</code> or install from <strong>ollama.ai</strong>.
        </div>
      )}

      {/* Pull a model */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>Pull a model</p>
        <div className="flex gap-2">
          {/* Preset dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="glass-input px-3 py-2 text-sm w-full flex items-center justify-between gap-2"
              style={{ color: "var(--color-text)", cursor: "pointer" }}
            >
              <span className="truncate">{POPULAR_MODELS.find(m => m.name === selectedPreset)?.label ?? selectedPreset}</span>
              <ChevronDown size={12} style={{ color: "var(--color-muted)", flexShrink: 0 }} />
            </button>
            {showDropdown && (
              <div className="glass-panel animate-fade-in" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, maxHeight: "220px", overflowY: "auto" }}>
                {POPULAR_MODELS.map(m => (
                  <button
                    key={m.name}
                    onClick={() => { setSelectedPreset(m.name); setShowDropdown(false); }}
                    className="hover:bg-white/[0.05] transition-colors"
                    style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "12px", border: "none", cursor: "pointer", background: m.name === selectedPreset ? "rgba(255,255,255,0.06)" : "transparent", color: "var(--color-text)" }}
                  >
                    <div>{m.label}</div>
                    <div style={{ color: "var(--color-muted)", fontSize: "10px" }}>{m.size}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => pullModel(selectedPreset)}
            disabled={!!pulling || !running}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm shrink-0"
          >
            {pulling === selectedPreset ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Pull
          </button>
        </div>

        {/* Custom model name input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="or type a model name (e.g. llama3.2:1b)"
            className="glass-input px-3 py-2 text-sm flex-1"
            style={{ color: "var(--color-text)" }}
            onKeyDown={(e) => { if (e.key === "Enter" && customModel.trim()) pullModel(customModel.trim()); }}
          />
          <button
            onClick={() => { if (customModel.trim()) pullModel(customModel.trim()); }}
            disabled={!!pulling || !customModel.trim() || !running}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm shrink-0"
          >
            <Download size={13} />
            Pull
          </button>
        </div>

        {/* Pull progress */}
        {pulling && pullStatus && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                {pulling}: {pullStatus.status}
              </span>
              {pullProgress !== null && (
                <span className="text-[11px]" style={{ color: "var(--color-text)" }}>{pullProgress}%</span>
              )}
            </div>
            {pullProgress !== null && (
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-3)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pullProgress}%`, background: "var(--color-accent)" }}
                />
              </div>
            )}
            {pullStatus.error && (
              <p className="text-[11px]" style={{ color: "var(--color-red)" }}>Error: {pullStatus.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Installed models */}
      {models.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>Installed ({models.length})</p>
          <div className="flex flex-col gap-1">
            {models.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
              >
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>{m.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-muted)" }}>
                    {formatBytes(m.size)} · {m.details?.parameter_size ?? ""} {m.details?.family ?? ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteModel(m.name)}
                  disabled={deleting === m.name}
                  className="btn-ghost p-1.5"
                  style={{ color: "var(--color-red)" }}
                  title="Delete model"
                >
                  {deleting === m.name ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {running && !loading && models.length === 0 && (
        <p className="text-[12px] text-center py-2" style={{ color: "var(--color-muted)" }}>
          No models installed. Pull one above to get started.
        </p>
      )}
    </div>
  );
}
