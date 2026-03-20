"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      onClick={refresh}
      style={{
        backgroundColor: "#1a1a24",
        border: "1px solid #2a2a3a",
        borderRadius: "8px",
        color: "#6b7280",
        cursor: "pointer",
        fontSize: "13px",
      }}
      className="flex items-center gap-2 px-3 py-2 hover:text-gray-200 hover:border-gray-500 transition-colors"
    >
      <RefreshCw
        size={13}
        style={{
          transition: "transform 0.6s",
          transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
        }}
      />
      Refresh
    </button>
  );
}
