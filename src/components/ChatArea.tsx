"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, User, Sparkles, Plus } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkQuranHighlight from "@/lib/remarkQuranHighlight";

export function ChatArea() {
  const { activeConversation, isStreaming, createNewConversation } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastMessageCountRef = useRef(0);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isNearBottom);
  };

  // Auto-scroll when new messages arrive or when streaming
  useEffect(() => {
    if (!activeConversation) return;

    const messageCount = activeConversation.messages.length;
    const hasNewMessage = messageCount > lastMessageCountRef.current;
    
    if ((hasNewMessage || isStreaming) && shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    lastMessageCountRef.current = messageCount;
  }, [activeConversation?.messages, isStreaming, shouldAutoScroll]);

  // Reset auto-scroll when switching conversations
  useEffect(() => {
    setShouldAutoScroll(true);
    lastMessageCountRef.current = activeConversation?.messages.length || 0;
    // Scroll immediately when switching conversations
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 0);
  }, [activeConversation?.id]);

  const handleCreateNewConversation = async () => {
    try {
      await createNewConversation();
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  if (!activeConversation) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[rgb(var(--color-surface-base))]">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleCreateNewConversation}
            className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-[rgb(var(--color-accent-300))] via-[rgb(var(--color-slate-400))] to-[rgb(var(--color-purple-400))] dark:from-[rgb(var(--color-dark-accent-200))] dark:via-[rgb(var(--color-dark-slate-200))] dark:to-[rgb(var(--color-dark-purple-200))] shadow-depth-xl hover:shadow-depth-lg active:shadow-depth-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent-300))]/50 dark:focus:ring-[rgb(var(--color-dark-accent-200))]/50"
            aria-label="ابدأ محادثة جديدة"
          >
            <Plus className="h-16 w-16 text-white drop-shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform" />
          </button>
          <div className="flex flex-col items-center gap-2 text-center max-w-md">
            <h2 className="text-xl font-bold text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-dark-text-primary))]">
              ابدأ محادثة جديدة
            </h2>
            <p className="text-sm text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-dark-text-secondary))] leading-relaxed">
              اكتب سؤالك أو طلبك البحثي في الحقل أدناه وسيتم إنشاء محادثة جديدة تلقائياً
            </p>
            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-surface-elevated))] dark:bg-[rgb(var(--color-dark-surface-elevated))] border border-[rgb(var(--color-border-subtle))] dark:border-[rgb(var(--color-dark-border-subtle))]">
              <MessageCircle className="h-4 w-4 text-[rgb(var(--color-accent-300))] dark:text-[rgb(var(--color-dark-accent-200))]" />
              <span className="text-xs font-medium text-[rgb(var(--color-text-tertiary))] dark:text-[rgb(var(--color-dark-text-tertiary))]">
                أو اختر محادثة من القائمة الجانبية
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[rgb(var(--color-bg-layer-1))]">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {activeConversation.messages.map((message) => (
          <article
            key={message.id}
            className={`flex flex-col gap-2 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-depth-sm ${
                message.role === "user"
                  ? "bg-gradient-to-br from-[rgb(var(--color-slate-400))] to-[rgb(var(--color-purple-400))]"
                  : "bg-gradient-to-br from-[rgb(var(--color-accent-300))] to-[rgb(var(--color-accent-200))]"
              }`}>
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                )}
              </div>
              <span className="text-[0.7rem] font-semibold text-[rgb(var(--color-text-secondary))]">
                {message.role === "user" ? "أنت" : "الباحث القرآني"}
              </span>
            </div>
            <div
              className={`px-4 py-3 text-sm leading-7 ${
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-[rgb(var(--color-user-msg-base))] text-[rgb(var(--color-text-primary))] shadow-depth-md ring-1 ring-[rgb(var(--color-slate-400))]/10"
                  : "w-full text-[rgb(var(--color-text-primary))]"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkQuranHighlight]}
                    components={{
                      // Custom rendering for better RTL support while preserving custom classes
                      p: ({ children, className, ...props }) => (
                        <p
                          className={["mb-2 last:mb-0 leading-7", className].filter(Boolean).join(" ")}
                          {...props}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children, className, ...props }) => (
                        <ul
                          className={["mr-4 mb-2 space-y-1 list-disc", className].filter(Boolean).join(" ")}
                          {...props}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children, className, ...props }) => (
                        <ol
                          className={["mr-4 mb-2 space-y-1 list-decimal", className].filter(Boolean).join(" ")}
                          {...props}
                        >
                          {children}
                        </ol>
                      ),
                      li: ({ children, className, ...props }) => (
                        <li
                          className={["text-right mr-4", className].filter(Boolean).join(" ")}
                          {...props}
                        >
                          {children}
                        </li>
                      ),
                      strong: ({ children, className, ...props }) => (
                        <strong
                          className={["font-bold text-[rgb(var(--color-text-primary))]", className]
                            .filter(Boolean)
                            .join(" ")}
                          {...props}
                        >
                          {children}
                        </strong>
                      ),
                      code: ({ children, className, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-accent-300))] px-1.5 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      blockquote: ({ children, className, ...props }) => (
                        <blockquote
                          className={[
                            "border-r-4 border-[rgb(var(--color-accent-300))] pr-4 mr-2 my-2 text-[rgb(var(--color-text-secondary))] italic",
                            className,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          {...props}
                        >
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children, className, ...props }) => (
                        <h1
                          className={["text-xl font-bold mb-2 text-[rgb(var(--color-text-primary))]", className]
                            .filter(Boolean)
                            .join(" ")}
                          {...props}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children, className, ...props }) => (
                        <h2
                          className={["text-lg font-bold mb-2 text-[rgb(var(--color-text-primary))]", className]
                            .filter(Boolean)
                            .join(" ")}
                          {...props}
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ children, className, ...props }) => (
                        <h3
                          className={["text-base font-bold mb-1 text-[rgb(var(--color-text-primary))]", className]
                            .filter(Boolean)
                            .join(" ")}
                          {...props}
                        >
                          {children}
                        </h3>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
            {message.timestamp && (
              <span className="text-[0.65rem] text-[rgb(var(--color-text-quaternary))]">
                {message.timestamp}
              </span>
            )}
          </article>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-tertiary))]">
            <span className="flex h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--color-accent-300))] shadow-depth-xs" />
            <span className="flex h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--color-accent-300))] shadow-depth-xs [animation-delay:120ms]" />
            <span className="flex h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--color-accent-300))] shadow-depth-xs [animation-delay:240ms]" />
            <span className="font-medium">يكتب...</span>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
