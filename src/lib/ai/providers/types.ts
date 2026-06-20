export type AiProvider = "openai" | "anthropic";

export type AiLlmSource = "org" | "platform";

export interface ResolvedLlmConfig {
  source: AiLlmSource;
  provider: AiProvider;
  apiKey: string;
  model: string;
}

export interface AiIntegrationPublic {
  provider: AiProvider;
  apiKeyHint: string;
  model: string | null;
  isEnabled: boolean;
  hasApiKey: boolean;
  updatedAt: string;
  lastVerifiedAt: string | null;
  lastProbeError: string | null;
}

export const aiProviderOptions: Array<{
  value: AiProvider;
  label: string;
  description: string;
  defaultModel: string;
  keyPrefix: string;
  docsUrl: string;
}> = [
  {
    value: "anthropic",
    label: "Claude",
    description: "Anthropic API — keys from console.anthropic.com (Claude Pro uses separate billing)",
    defaultModel: "claude-sonnet-4-6",
    keyPrefix: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    value: "openai",
    label: "OpenAI",
    description: "ChatGPT API — keys from platform.openai.com",
    defaultModel: "gpt-4o-mini",
    keyPrefix: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
  },
];

export function getDefaultModelForProvider(provider: AiProvider): string {
  return (
    aiProviderOptions.find((option) => option.value === provider)?.defaultModel ??
    "gpt-4o-mini"
  );
}

export function apiKeyHint(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}
