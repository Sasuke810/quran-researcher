"use client";

import React, { useState } from "react";
import { ChevronDown, Sparkles, Zap, Brain, Cpu } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  icon: React.ReactNode;
  contextLength: number;
  recommended?: boolean;
}

// Curated list of models for Quran research
export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "x-ai/grok-4-fast",
    name: "xAI: Grok 4 Fast",
    provider: "xAI",
    icon: <Cpu className="h-4 w-4" />,
    contextLength: 128000,
    recommended: true,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Anthropic: Claude Sonnet 4.5",
    provider: "Anthropic",
    icon: <Sparkles className="h-4 w-4" />,
    contextLength: 200000,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Google: Gemini 2.5 Pro\n",
    provider: "Google",
    icon: <Zap className="h-4 w-4" />,
    contextLength: 200000,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: <Brain className="h-4 w-4" />,
    contextLength: 128000,
  },
  {
    id: "openai/gpt-5",
    name: "OpenAI: GPT-5\n",
    provider: "OpenAI",
    icon: <Zap className="h-4 w-4" />,
    contextLength: 128000,
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    icon: <Brain className="h-4 w-4" />,
    contextLength: 1000000,
  }
];

type ModelSelectorProps = {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
};

export function ModelSelector({ selectedModel, onModelChange, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs bg-[rgb(var(--color-surface-raised))] dark:bg-[rgb(var(--color-dark-surface-raised))] hover:bg-[rgb(var(--color-surface-elevated))] dark:hover:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] shadow-depth-sm hover:shadow-depth-md transition-all"
        >
          {currentModel.icon}
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 bottom-full z-50 mb-2 w-72 rounded-xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] shadow-depth-xl border border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))] overflow-hidden">
              <div className="max-h-96 overflow-y-auto p-2">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-right transition-all ${
                      model.id === selectedModel
                        ? "bg-[rgb(var(--color-accent-300))]/10 dark:bg-[rgb(var(--color-dark-accent-200))]/10 ring-1 ring-[rgb(var(--color-accent-300))]/30"
                        : "hover:bg-[rgb(var(--color-surface-raised))] dark:hover:bg-[rgb(var(--color-dark-surface-raised))]"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      model.id === selectedModel
                        ? "bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white"
                        : "bg-[rgb(var(--color-surface-elevated))] dark:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-tertiary))]"
                    }`}>
                      {model.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                          {model.name}
                        </span>
                        {model.recommended && (
                          <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[rgb(var(--color-accent-300))]/20 text-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))]/20 dark:text-[rgb(var(--color-dark-accent-200))] font-medium">
                            موصى به
                          </span>
                        )}
                      </div>
                      <p className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))] dark:text-[rgb(var(--color-dark-text-quaternary))] mt-1">
                        {model.provider} • {(model.contextLength / 1000).toLocaleString('ar-SA')}K سياق
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] mb-2">
        اختر النموذج
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[rgb(var(--color-surface-raised))] dark:bg-[rgb(var(--color-dark-surface-raised))] hover:bg-[rgb(var(--color-surface-elevated))] dark:hover:bg-[rgb(var(--color-dark-surface-elevated))] shadow-depth-sm hover:shadow-depth-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white">
              {currentModel.icon}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                {currentModel.name}
              </div>
              <div className="text-[0.7rem] text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
                {currentModel.description}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-[rgb(var(--color-text-tertiary))] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 bottom-full z-50 mb-2 w-full rounded-xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] shadow-depth-xl border border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))] overflow-hidden">
              <div className="max-h-96 overflow-y-auto p-2">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-right transition-all ${
                      model.id === selectedModel
                        ? "bg-[rgb(var(--color-accent-300))]/10 dark:bg-[rgb(var(--color-dark-accent-200))]/10 ring-1 ring-[rgb(var(--color-accent-300))]/30"
                        : "hover:bg-[rgb(var(--color-surface-raised))] dark:hover:bg-[rgb(var(--color-dark-surface-raised))]"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      model.id === selectedModel
                        ? "bg-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))] text-white"
                        : "bg-[rgb(var(--color-surface-elevated))] dark:bg-[rgb(var(--color-dark-surface-elevated))] text-[rgb(var(--color-text-tertiary))]"
                    }`}>
                      {model.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                          {model.name}
                        </span>
                        {model.recommended && (
                          <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[rgb(var(--color-accent-300))]/20 text-[rgb(var(--color-accent-300))] dark:bg-[rgb(var(--color-dark-accent-200))]/20 dark:text-[rgb(var(--color-dark-accent-200))] font-medium">
                            موصى به
                          </span>
                        )}
                      </div>
                      <p className="text-[0.7rem] text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))] mt-0.5">
                        {model.description}
                      </p>
                      <p className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))] dark:text-[rgb(var(--color-dark-text-quaternary))] mt-1">
                        {model.provider} • {(model.contextLength / 1000).toLocaleString('ar-SA')}K سياق
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
