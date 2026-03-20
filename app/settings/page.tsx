import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

function EnvRow({
  name,
  value,
  description,
  required,
}: {
  name: string;
  value: string | undefined;
  description: string;
  required: boolean;
}) {
  const set = !!value;
  return (
    <div
      style={{ borderBottom: "1px solid #2a2a3a" }}
      className="flex items-center justify-between py-4"
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <code style={{ color: "#a5b4fc", fontSize: "13px" }}>{name}</code>
          {required && (
            <span
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: "10px",
                borderRadius: "4px",
                padding: "1px 5px",
              }}
            >
              required
            </span>
          )}
        </div>
        <p style={{ color: "#6b7280", fontSize: "13px" }}>{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {set ? (
          <>
            <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: "13px" }}>Set</span>
          </>
        ) : (
          <>
            <XCircle size={15} style={{ color: required ? "#ef4444" : "#4b5563" }} />
            <span
              style={{ color: required ? "#ef4444" : "#4b5563", fontSize: "13px" }}
            >
              Not set
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const vars = [
    {
      name: "ANTHROPIC_API_KEY",
      value: process.env.ANTHROPIC_API_KEY,
      description: "Claude API key — powers the Chat copilot and Playground task orchestration",
      required: true,
    },
    {
      name: "AGENTS_BASE_URL",
      value: process.env.AGENTS_BASE_URL,
      description: "Base URL for your Python agent microservices (default: http://localhost)",
      required: false,
    },
    {
      name: "AGENT_MARKETING_PORT",
      value: process.env.AGENT_MARKETING_PORT,
      description: "Marketing agent port (default: 8001)",
      required: false,
    },
    {
      name: "AGENT_ACCOUNTING_PORT",
      value: process.env.AGENT_ACCOUNTING_PORT,
      description: "Accounting agent port (default: 8002)",
      required: false,
    },
    {
      name: "AGENT_MESSAGING_PORT",
      value: process.env.AGENT_MESSAGING_PORT,
      description: "Messaging agent port (default: 8003)",
      required: false,
    },
    {
      name: "AGENT_WEBSITE_BUILDER_PORT",
      value: process.env.AGENT_WEBSITE_BUILDER_PORT,
      description: "Website Builder agent port (default: 3001)",
      required: false,
    },
  ];

  const allRequiredSet = vars.filter((v) => v.required).every((v) => !!v.value);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div>
        <h1 style={{ color: "#e2e2f0" }} className="text-xl font-semibold">
          Settings
        </h1>
        <p style={{ color: "#6b7280" }} className="text-sm mt-0.5">
          Configuration status — edit <code style={{ color: "#a5b4fc" }}>.env.local</code> then restart the dev server to apply changes
        </p>
      </div>

      {!allRequiredSet && (
        <div
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px",
          }}
          className="px-4 py-3"
        >
          <p style={{ color: "#ef4444" }} className="text-sm font-medium">
            Missing required configuration
          </p>
          <p style={{ color: "#6b7280" }} className="text-xs mt-0.5">
            Copy <code>.env.local.example</code> to <code>.env.local</code> and fill in your values, then restart with <code>npm run dev</code>.
          </p>
        </div>
      )}

      {/* Environment Variables */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="px-5"
      >
        <div style={{ borderBottom: "1px solid #2a2a3a" }} className="py-4">
          <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
            Environment Variables
          </h2>
        </div>
        {vars.map((v) => (
          <EnvRow key={v.name} {...v} />
        ))}
      </div>

      {/* Quick links */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="p-5"
      >
        <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm mb-4">
          Quick Links
        </h2>
        <div className="flex flex-col gap-2">
          {[
            { label: "Get Anthropic API Key", href: "https://console.anthropic.com/settings/keys" },
            { label: "Agent API docs — Marketing (port 8001)", href: "http://localhost:8001/docs" },
            { label: "Agent API docs — Accounting (port 8002)", href: "http://localhost:8002/docs" },
            { label: "Agent API docs — Messaging (port 8003)", href: "http://localhost:8003/docs" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a5b4fc", fontSize: "14px" }}
              className="flex items-center gap-1.5 hover:opacity-80"
            >
              <ExternalLink size={13} />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Stack info */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="p-5"
      >
        <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm mb-4">
          Stack
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Framework", "Next.js 16 (App Router)"],
            ["Runtime", "React 19 / Node 20+"],
            ["Styling", "Tailwind CSS v4"],
            ["AI", "Anthropic claude-sonnet-4-6"],
            ["Icons", "Lucide React"],
            ["Language", "TypeScript 5"],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ color: "#6b7280" }}>{k}: </span>
              <span style={{ color: "#e2e2f0" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
