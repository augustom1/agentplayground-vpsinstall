export type AIProvider = "anthropic" | "openai" | "ollama";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

const PROVIDER_DEFAULTS: Record<AIProvider, { model: string; baseUrl?: string }> = {
  anthropic: { model: "claude-sonnet-4-6" },
  openai: { model: "gpt-4o" },
  ollama: { model: "llama3", baseUrl: "http://localhost:11434" },
};

export function getActiveProvider(): ProviderConfig {
  // Read from env — only Anthropic is wired for now
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ollamaUrl = process.env.OLLAMA_BASE_URL;

  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL ?? PROVIDER_DEFAULTS.openai.model,
    };
  }

  if (ollamaUrl) {
    return {
      provider: "ollama",
      model: process.env.OLLAMA_MODEL ?? PROVIDER_DEFAULTS.ollama.model,
      baseUrl: ollamaUrl,
    };
  }

  return {
    provider: "anthropic",
    apiKey: anthropicKey,
    model: process.env.ANTHROPIC_MODEL ?? PROVIDER_DEFAULTS.anthropic.model,
  };
}

export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_DEFAULTS[provider].model;
}

export function getProviderDisplayName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    anthropic: "Anthropic Claude",
    openai: "OpenAI",
    ollama: "Ollama (Local)",
  };
  return names[provider];
}
