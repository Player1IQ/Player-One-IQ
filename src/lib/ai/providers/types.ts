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
}

export const aiProviderOptions: Array<{
  value: AiProvider;
  label: string;
  defaultModel: string;
  keyPrefix: string;
  docsUrl: string;
}> = [
  {
    value: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    keyPrefix: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    defaultModel: "claude-3-5-haiku-20241022",
    keyPrefix: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
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
