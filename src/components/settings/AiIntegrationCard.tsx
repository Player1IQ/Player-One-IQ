"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Unplug } from "lucide-react";
import {
  disconnectAiIntegration,
  saveAiIntegrationSettings,
  testAiIntegrationConnection,
} from "@/app/settings/ai-integration-actions";
import type { AiIntegrationPublic, AiProvider } from "@/lib/ai/providers/types";
import { aiProviderOptions } from "@/lib/ai/providers/types";

interface AiIntegrationCardProps {
  integration: AiIntegrationPublic | null;
  encryptionConfigured: boolean;
  platformFallbackConfigured: boolean;
  canManage: boolean;
}

export function AiIntegrationCard({
  integration,
  encryptionConfigured,
  platformFallbackConfigured,
  canManage,
}: AiIntegrationCardProps) {
  const [provider, setProvider] = useState<AiProvider>(
    integration?.provider ?? "openai"
  );
  const [model, setModel] = useState(
    integration?.model ??
      aiProviderOptions.find((option) => option.value === provider)
        ?.defaultModel ??
      "gpt-4o-mini"
  );
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(integration?.isEnabled ?? true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();

  const selectedProvider =
    aiProviderOptions.find((option) => option.value === provider) ??
    aiProviderOptions[0];

  function handleProviderChange(nextProvider: AiProvider) {
    setProvider(nextProvider);
    const defaults = aiProviderOptions.find(
      (option) => option.value === nextProvider
    );
    if (defaults && !integration?.model) {
      setModel(defaults.defaultModel);
    }
  }

  function handleSave() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await saveAiIntegrationSettings({
        provider,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
        isEnabled,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setApiKey("");
      setMessage("AI integration saved.");
    });
  }

  function handleTest() {
    setMessage("");
    setError("");
    startTestTransition(async () => {
      const result = await testAiIntegrationConnection({
        provider,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("success" in result && result.success) {
        setMessage(
          `Connection successful (${result.provider}, ${result.model}).`
        );
      }
    });
  }

  function handleDisconnect() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await disconnectAiIntegration();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setApiKey("");
      setMessage("Disconnected your workspace AI key.");
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-accent-light" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">AI integration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Connect your workspace&apos;s AI provider. Live insights use your API
            key and bill your provider account directly. Without a workspace key,
            {platformFallbackConfigured
              ? " the platform OpenAI key is used as fallback."
              : " demo/sample responses are shown."}
          </p>

          {!encryptionConfigured ? (
            <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Server encryption is not configured yet. Add{" "}
              <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">
                AI_CREDENTIALS_ENCRYPTION_KEY
              </code>{" "}
              before saving keys.
            </p>
          ) : null}

          {integration?.hasApiKey ? (
            <p className="mt-3 text-sm text-gray-400">
              Connected key:{" "}
              <span className="font-mono text-gray-200">
                {integration.apiKeyHint}
              </span>
              {integration.isEnabled ? (
                <span className="ml-2 text-emerald-400">Enabled</span>
              ) : (
                <span className="ml-2 text-amber-400">Disabled</span>
              )}
            </p>
          ) : null}

          {canManage ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-gray-400">Provider</span>
                  <select
                    value={provider}
                    onChange={(event) =>
                      handleProviderChange(event.target.value as AiProvider)
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                  >
                    {aiProviderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-gray-400">Model</span>
                  <input
                    type="text"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder={selectedProvider.defaultModel}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="text-gray-400">API key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={
                    integration?.hasApiKey
                      ? "Leave blank to keep current key"
                      : `Paste your ${selectedProvider.label} API key`
                  }
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Keys are encrypted server-side and never sent to the browser
                  after save. Get a key from{" "}
                  <a
                    href={selectedProvider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-light hover:text-white"
                  >
                    {selectedProvider.label}
                  </a>
                  .
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(event) => setIsEnabled(event.target.checked)}
                  className="rounded border-border"
                />
                Use this workspace AI key for live insights
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || !encryptionConfigured}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Save integration
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-200 hover:border-accent/30 disabled:opacity-50"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Test connection
                </button>
                {integration?.hasApiKey ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Unplug className="h-4 w-4" />
                    Disconnect
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Only workspace owners and admins can manage AI integrations.
            </p>
          )}

          {message ? (
            <p className="mt-3 text-sm text-emerald-400">{message}</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
