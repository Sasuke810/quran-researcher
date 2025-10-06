"use client";

import React from "react";
import { X, Plus, MessageSquare, Clock, Trash2, Loader2 } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation, 
    createNewConversation,
    deleteConversation,
    isLoading,
    error,
  } = useConversation();

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
    onClose(); // Close sidebar on mobile after selection
  };

  const handleNewConversation = () => {
    createNewConversation();
    onClose(); // Close sidebar on mobile after creating new conversation
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex h-screen w-80 flex-col gap-5 overflow-hidden rounded-l-3xl bg-[rgb(var(--color-surface-base))] dark:bg-[rgb(var(--color-dark-surface-base))] p-4 text-sm shadow-depth-xl duration-300 lg:relative lg:h-full lg:w-auto lg:translate-x-0 lg:rounded-3xl lg:shadow-depth-lg ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close button for mobile */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--color-interactive-base))] dark:bg-[rgb(var(--color-dark-interactive-base))] hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 shadow-depth-sm hover:shadow-depth-md transition-all lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4 text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] hover:text-red-600 dark:hover:text-red-400" />
        </button>

        <div className="flex shrink-0 items-center justify-between pt-6 lg:pt-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[rgb(var(--color-accent-300))] dark:text-[rgb(var(--color-dark-accent-200))]" />
              <span className="text-xs font-bold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
                المحادثات الأخيرة
              </span>
            </div>
            <span className="text-[0.65rem] text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
              {conversations.length} جلسة
            </span>
          </div>
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--color-purple-400))] to-[rgb(var(--color-accent-300))] dark:from-[rgb(var(--color-dark-purple-200))] dark:to-[rgb(var(--color-dark-accent-200))] hover:from-[rgb(var(--color-purple-300))] hover:to-[rgb(var(--color-accent-200))] dark:hover:from-[rgb(var(--color-dark-purple-300))] dark:hover:to-[rgb(var(--color-dark-accent-300))] shadow-depth-md hover:shadow-depth-lg active:shadow-depth-inset transition-all"
            aria-label="بدء جلسة جديدة"
          >
            <Plus className="h-4 w-4 text-white drop-shadow-sm" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--color-accent-300))]" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[rgb(var(--color-text-tertiary))]">لا توجد محادثات</p>
            </div>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition-all ${
                  chat.id === activeConversationId
                    ? "bg-[rgb(var(--color-surface-elevated))] shadow-depth-md ring-1 ring-[rgb(var(--color-accent-300))]/30"
                    : "bg-[rgb(var(--color-surface-raised))] shadow-depth-sm hover:shadow-depth-md hover:bg-[rgb(var(--color-surface-elevated))] active:shadow-depth-inset"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleConversationClick(chat.id)}
                  className="flex flex-1 items-center gap-3 w-full"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-right font-semibold text-[rgb(var(--color-text-primary))]">
                        {chat.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[rgb(var(--color-text-quaternary))]" />
                        <span className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))]">
                          {chat.time}
                        </span>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-right text-[0.7rem] text-[rgb(var(--color-text-tertiary))]">
                      {chat.snippet}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
                      deleteConversation(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all shadow-depth-xs hover:shadow-depth-sm"
                  aria-label="حذف المحادثة"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
