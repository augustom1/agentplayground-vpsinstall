"use client";

import { useState } from "react";
import { FolderOpen, ExternalLink, RefreshCw } from "lucide-react";

const FILEBROWSER_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : "http://localhost:8080";

export default function FilesPage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Files
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Manage project files — powered by FileBrowser
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <a
            href={FILEBROWSER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-1.5 px-3 py-2"
          >
            <ExternalLink size={13} />
            Open in Tab
          </a>
        </div>
      </div>

      {/* FileBrowser iframe */}
      <div className="flex-1 mx-6 mb-6 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
        <iframe
          key={iframeKey}
          src={FILEBROWSER_URL}
          className="w-full h-full"
          style={{ minHeight: "calc(100vh - 140px)", border: "none", background: "#0a0a14" }}
          title="FileBrowser"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
