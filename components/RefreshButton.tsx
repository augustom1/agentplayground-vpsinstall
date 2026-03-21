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
      className="btn-ghost flex items-center gap-2 px-3 py-2"
      style={{ fontSize: "13px" }}
    >
      <RefreshCw
        size={13}
        style={{
          transition: "transform 0.6s ease",
          transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
        }}
      />
      Refresh
    </button>
  );
}
