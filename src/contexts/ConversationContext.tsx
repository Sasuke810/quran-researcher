"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ChatService } from "@/services/chatService";
import { LlmChatWithRequests } from "@/lib/models/llmChat";
import { LlmRequest } from "@/lib/models/llmRequest";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
};

export type Conversation = {
  id: string;
  name: string;
  snippet: string;
  time: string;
  avatarInitials: string;
  status?: "active" | "default";
  messages: ChatMessage[];
  dbId?: number; // Database ID for API calls
};

type ConversationContextType = {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  setActiveConversation: (id: string) => void;
  createNewConversation: () => Promise<string | null>;
  addMessage: (conversationId: string, message: Omit<ChatMessage, "id">, model: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const STORAGE_KEY = "quran_conversations";

const defaultConversations: Conversation[] = [
  {
    id: "session-1",
    name: "حلقة التدبر الأسبوعية",
    snippet: "تفصيل معنى الرحمة في سورة مريم...",
    time: "قبل 5 دقائق",
    avatarInitials: "رح",
    status: "active",
    messages: [
      {
        id: "1",
        role: "assistant",
        content: "مرحبًا بك في الباحث في القرآن. كيف يمكنني مساعدتك في دراستك اليوم؟",
        timestamp: "قبل دقيقة",
      },
      {
        id: "2",
        role: "user",
        content: "أبحث عن الآيات التي تتناول الرحمة وأحتاج سياق النزول لكل منها.",
        timestamp: "قبل 45 ثانية",
      },
      {
        id: "3",
        role: "assistant",
        content:
          "تظهر الرحمة في آيات عديدة، من أبرزها قوله تعالى: ﴿وَرَبُّكَ الْغَفُورُ ذُو الرَّحْمَةِ﴾ (الكهف ٥٨). تشير مصادر التفسير كابن كثير والطبري إلى أن الآية نزلت تثبيتًا للنبي ﷺ حين استبطاء إيمان بعض الأقوام. هل ترغب في تحليل مواضع أخرى؟",
        timestamp: "قبل 20 ثانية",
      },
    ],
  },
  {
    id: "session-2",
    name: "الذكاء القرآني",
    snippet: "تم تحليل السياق في آيات الصبر.",
    time: "اليوم",
    avatarInitials: "ذك",
    messages: [],
  },
  {
    id: "session-3",
    name: "أسئلة فقهية",
    snippet: "تفسير آية الدين من سورة البقرة.",
    time: "أمس",
    avatarInitials: "فق",
    messages: [],
  },
  {
    id: "session-4",
    name: "السيرة في القرآن",
    snippet: "كيف ورد ذكر الأنبياء؟",
    time: "منذ 3 أيام",
    avatarInitials: "سر",
    messages: [],
  },
  {
    id: "session-5",
    name: "أبحاث لغوية",
    snippet: "مواضع جذر كتب في السور المكية...",
    time: "منذ أسبوع",
    avatarInitials: "لغ",
    messages: [],
  },
];

// Helper function to format dates in a readable way
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 7) return `قبل ${diffDays} يوم`;
  
  // For older dates, show standard date format
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to convert API chat to Conversation
function convertChatToConversation(chat: LlmChatWithRequests): Conversation {
  const messages: ChatMessage[] = (chat.requests || []).flatMap((req) => {
    const msgs: ChatMessage[] = [
      {
        id: `req-${req.id}`,
        role: "user",
        content: req.prompt,
        timestamp: req.created_at ? formatFullTimestamp(new Date(req.created_at)) : undefined,
      },
    ];
    
    if (req.response) {
      msgs.push({
        id: `res-${req.id}`,
        role: "assistant",
        content: req.response,
        timestamp: req.updated_at ? formatFullTimestamp(new Date(req.updated_at)) : undefined,
      });
    }
    
    return msgs;
  });

  const lastRequest = chat.requests?.[chat.requests.length - 1];
  const snippet = lastRequest?.prompt 
    ? lastRequest.prompt.slice(0, 50) + (lastRequest.prompt.length > 50 ? "..." : "")
    : "محادثة جديدة";
  
  return {
    id: `chat-${chat.id}`,
    dbId: chat.id,
    name: `محادثة ${chat.id}`,
    snippet,
    time: chat.updated_at ? formatTimestamp(new Date(chat.updated_at)) : "الآن",
    avatarInitials: "مح",
    messages,
  };
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from API on mount
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const chats = await ChatService.getAllChats();
      const converted = chats.map(convertChatToConversation);
      setConversations(converted);
      
      // Set first conversation as active if none selected
      if (!activeConversationId && converted.length > 0) {
        setActiveConversationId(converted[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to load conversations");
      // Fallback to default conversations on error
      setConversations(defaultConversations);
      setActiveConversationId("session-1");
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const setActiveConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        status: c.id === id ? "active" : "default",
      }))
    );
    setActiveConversationId(id);
  }, []);

  const createNewConversation = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      // Create a new chat in the database
      const newChat = await ChatService.createChat({
        user_id: "default-user", // TODO: Replace with actual user ID from auth
      });

      const now = new Date();
      const newConversation: Conversation = {
        id: `chat-${newChat.id}`,
        dbId: newChat.id,
        name: `محادثة ${newChat.id}`,
        snippet: "ابدأ محادثة جديدة...",
        time: "الآن",
        avatarInitials: "جد",
        status: "active",
        messages: [
          {
            id: "welcome-1",
            role: "assistant",
            content: "مرحبًا بك في الباحث في القرآن. كيف يمكنني مساعدتك اليوم؟",
            timestamp: formatFullTimestamp(now),
          },
        ],
      };

      setConversations((prev) =>
        [newConversation, ...prev.map((c) => ({ ...c, status: "default" as const }))]
      );
      setActiveConversationId(newConversation.id);

      return newConversation.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to create conversation");
      return null;
    }
  }, []);

  const addMessage = useCallback(async (conversationId: string, message: Omit<ChatMessage, "id">, model: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation || !conversation.dbId) {
      console.error("Conversation not found or missing dbId");
      return;
    }

    try {
      setError(null);
      
      // Optimistically add the user message to UI
      const tempMessageId = `temp-${Date.now()}`;
      const newMessage: ChatMessage = {
        ...message,
        id: tempMessageId,
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            snippet: message.role === "user" 
              ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
              : conv.snippet,
            time: "الآن",
          };
        })
      );

      if (message.role === "user") {
        // Send the request to the API with the selected model
        const request = await ChatService.createRequest({
          chat_id: conversation.dbId,
          prompt: message.content,
          model: model,
        });

        // Update the message with the actual ID from the database
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === tempMessageId ? { ...msg, id: `req-${request.id}` } : msg
              ),
            };
          })
        );

        // Add a temporary "thinking" message
        const thinkingMessageId = `thinking-${request.id}`;
        const thinkingTimestamp = formatFullTimestamp(new Date());
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              messages: [...conv.messages, {
                id: thinkingMessageId,
                role: "assistant" as const,
                content: "جاري التفكير...",
                timestamp: thinkingTimestamp,
              }],
            };
          })
        );

        // Call OpenRouter to get the streaming response
        try {
          setIsStreaming(true);
          
          // Get conversation history (all previous messages)
          const conversation = conversations.find((c) => c.id === conversationId);
          const conversationHistory = conversation?.messages || [];
          
          const response = await fetch('/api/llm-requests/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requestId: request.id,
              model: model,
              prompt: message.content,
              conversationHistory: conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate response');
          }

          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Failed to get response reader');
          }

          const decoder = new TextDecoder();
          let streamedContent = '';

          // Replace "thinking" message with empty assistant message
          const responseMessageId = `res-${request.id}`;
          const responseTimestamp = formatFullTimestamp(new Date());
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== conversationId) return conv;
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === thinkingMessageId
                    ? {
                        id: responseMessageId,
                        role: "assistant" as const,
                        content: '',
                        timestamp: responseTimestamp,
                      }
                    : msg
                ),
              };
            })
          );

          // Read the stream
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'chunk') {
                    // Append chunk to streamed content
                    streamedContent += data.content;
                    
                    // Update the message in real-time
                    setConversations((prev) =>
                      prev.map((conv) => {
                        if (conv.id !== conversationId) return conv;
                        return {
                          ...conv,
                          messages: conv.messages.map((msg) =>
                            msg.id === responseMessageId
                              ? { ...msg, content: streamedContent }
                              : msg
                          ),
                        };
                      })
                    );
                  } else if (data.type === 'done') {
                    // Streaming complete
                    console.log('Streaming complete', data);
                    setIsStreaming(false);
                  } else if (data.type === 'error') {
                    setIsStreaming(false);
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } catch (llmError) {
          console.error("Failed to get LLM response:", llmError);
          setIsStreaming(false);
          
          // Show error message
          const errorTimestamp = formatFullTimestamp(new Date());
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== conversationId) return conv;
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === thinkingMessageId || msg.id === `res-${request.id}`
                    ? {
                        id: `res-${request.id}`,
                        role: "assistant" as const,
                        content: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
                        timestamp: errorTimestamp,
                      }
                    : msg
                ),
              };
            })
          );
        }
      }
    } catch (err) {
      console.error("Failed to add message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }, [conversations]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, ...updates } : conv))
    );
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation || !conversation.dbId) {
      console.error("Conversation not found or missing dbId");
      return;
    }

    try {
      setError(null);
      await ChatService.deleteChat(conversation.dbId);
      
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    }
  }, [conversations, activeConversationId]);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        isLoading,
        isStreaming,
        error,
        setActiveConversation,
        createNewConversation,
        addMessage,
        updateConversation,
        deleteConversation,
        refreshConversations,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}
