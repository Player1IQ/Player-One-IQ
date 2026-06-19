import type { AiProvider } from "./types";

export type AiSetupGuideStep = {
  title: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
};

export type AiProviderSetupGuide = {
  provider: AiProvider;
  label: string;
  summary: string;
  keyPrefix: string;
  billingNote: string;
  steps: AiSetupGuideStep[];
};

export const aiProviderSetupGuides: Record<AiProvider, AiProviderSetupGuide> = {
  openai: {
    provider: "openai",
    label: "OpenAI",
    summary:
      "Use an API key from platform.openai.com. ChatGPT Plus is separate from API billing.",
    keyPrefix: "sk-",
    billingNote:
      "If you see a quota error, add a payment method under Settings → Billing before testing.",
    steps: [
      {
        title: "Open the OpenAI developer dashboard",
        detail:
          "Sign in at platform.openai.com with the account you want billed for API usage.",
        href: "https://platform.openai.com",
        hrefLabel: "platform.openai.com",
      },
      {
        title: "Enable billing",
        detail:
          "Go to Settings → Billing, add a payment method, and set a monthly usage limit (even $5–20 is enough to start).",
        href: "https://platform.openai.com/settings/organization/billing",
        hrefLabel: "Open billing settings",
      },
      {
        title: "Create an API key",
        detail:
          'Open API keys → Create new secret key. Name it (e.g. "Player One IQ") and copy the key immediately — it is only shown once.',
        href: "https://platform.openai.com/api-keys",
        hrefLabel: "Create API key",
      },
      {
        title: "Paste and test in Player One IQ",
        detail:
          "Paste the key below (starts with sk-), click Test connection, then Save integration.",
      },
    ],
  },
  anthropic: {
    provider: "anthropic",
    label: "Claude",
    summary:
      "Use an API key from console.anthropic.com. Claude Pro subscription is separate from API usage.",
    keyPrefix: "sk-ant-",
    billingNote:
      "API usage requires credits or billing on your Anthropic account before live insights will work.",
    steps: [
      {
        title: "Open the Anthropic console",
        detail:
          "Sign in at console.anthropic.com with the account that should own API usage.",
        href: "https://console.anthropic.com",
        hrefLabel: "console.anthropic.com",
      },
      {
        title: "Add billing or credits",
        detail:
          "Go to Settings → Billing and add a payment method or purchase credits for API access.",
        href: "https://console.anthropic.com/settings/billing",
        hrefLabel: "Open billing settings",
      },
      {
        title: "Create an API key",
        detail:
          'Open API Keys → Create Key. Copy the full key (starts with sk-ant-) — you will not see it again.',
        href: "https://console.anthropic.com/settings/keys",
        hrefLabel: "Create API key",
      },
      {
        title: "Paste and test in Player One IQ",
        detail:
          "Paste the key below, click Test connection, then Save integration.",
      },
    ],
  },
};

export function getAiProviderSetupGuide(
  provider: AiProvider
): AiProviderSetupGuide {
  return aiProviderSetupGuides[provider];
}
