"use client";

import React, { useState, FormEvent } from "react";
import { Send } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";
import { ModelSelector, AVAILABLE_MODELS } from "./ModelSelector";
import { TafsirSelector } from "./TafsirSelector";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [selectedTafsir, setSelectedTafsir] = useState<number | null>(null);
  const { activeConversationId, addMessage, createNewConversation } = useConversation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    const messageContent = message.trim();

    let conversationId = activeConversationId;

    // If no active conversation, create a new one first
    if (!conversationId) {
      console.log("No active conversation, creating new one...");
      conversationId = await createNewConversation();

      if (!conversationId) {
        console.error("Failed to create new conversation");
        return;
      }
    }

    console.log("Submitting message:", messageContent, "to conversation:", conversationId);

    // Add user message with selected model
    addMessage(conversationId, {
      role: "user",
      content: messageContent,
      timestamp: "الآن",
    }, selectedModel);

    // Clear input
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          compact
        />
        <TafsirSelector
          selectedTafsir={selectedTafsir}
          onTafsirChange={setSelectedTafsir}
          compact
        />
      </div>
      <label htmlFor="prompt" className="sr-only">
        اكتب سؤالك هنا
      </label>
      <div className="relative flex items-center gap-2">
        <textarea
          id="prompt"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="اكتب سؤالك أو طلبك البحثي..."
          className={`w-full resize-none rounded-2xl bg-[rgb(var(--color-surface-raised))] dark:bg-[rgb(var(--color-dark-surface-raised))] pl-14 pr-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-[rgb(var(--color-text-quaternary))] dark:placeholder:text-[rgb(var(--color-dark-text-quaternary))] text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))] shadow-depth-md focus:shadow-depth-lg focus:bg-[rgb(var(--color-surface-elevated))] dark:focus:bg-[rgb(var(--color-dark-surface-elevated))] focus:ring-2 focus:ring-[rgb(var(--color-accent-300))]/30 dark:focus:ring-[rgb(var(--color-dark-accent-200))]/30 ${
            isFocused ? "h-28" : "h-14"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-accent-300))] via-[rgb(var(--color-slate-400))] to-[rgb(var(--color-purple-400))] dark:from-[rgb(var(--color-dark-accent-200))] dark:via-[rgb(var(--color-dark-slate-200))] dark:to-[rgb(var(--color-dark-purple-200))] hover:from-[rgb(var(--color-accent-200))] hover:via-[rgb(var(--color-slate-300))] hover:to-[rgb(var(--color-purple-300))] dark:hover:from-[rgb(var(--color-dark-accent-300))] dark:hover:via-[rgb(var(--color-dark-slate-300))] dark:hover:to-[rgb(var(--color-dark-purple-300))] shadow-depth-md hover:shadow-depth-lg active:shadow-depth-inset transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-depth-md"
          aria-label="إرسال"
        >
          <Send className="h-4 w-4 text-white drop-shadow-sm" />
        </button>
      </div>
    </form>
  );
}
