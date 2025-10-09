"use client";

import { nanoid } from "nanoid";
import type * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Message } from "ai";
export type UIMessage = Message;
import { createClient } from "~/utils/supabase/client";
import type { ExtendedMessage } from "./bot-message";
import { conversationHistory } from "~/lib/conversation-history";

// Unified chat state interface
export interface UnifiedChatState {
	// Core chat state
	messages: Message[];
	status: "idle" | "submitted" | "streaming" | "awaiting" | "error";
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setStatus: React.Dispatch<React.SetStateAction<"idle" | "submitted" | "streaming" | "awaiting" | "error">>;
	customMessages: ExtendedMessage[];
	setCustomMessages: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
  // Input state and handlers (used by chat input components)
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
	
	// Drawer state
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	
	// Authentication state (optional)
	isAuthenticated: boolean;
	userId?: string;
	conversationId?: string;
	isLoadingHistory: boolean;
}

// Context with all state
interface ChatContextValue {
	chat: UnifiedChatState;
	customMessages: ExtendedMessage[];
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	isLoadingHistory: boolean;
	// Meditation-specific state
	meditationMode: "chat" | "meditation";
	setMeditationMode: React.Dispatch<React.SetStateAction<"chat" | "meditation">>;
	addCustomMessage: (message: ExtendedMessage) => void;
	updateCustomMessage: (id: string, updates: Partial<ExtendedMessage>) => void;
	clearCustomMessages: () => void;
	isGeneratingMeditation: boolean;
	setIsGeneratingMeditation: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatState = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatState must be used within a ChatStateProvider");
	}
	return context;
};

/**
 * Drawer hook for backward compatibility
 */
export function useDrawer() {
	const { isDrawerOpen, setIsDrawerOpen } = useChatState();
	
	return {
		isOpen: isDrawerOpen,
		toggleDrawer: () => setIsDrawerOpen(!isDrawerOpen),
		openDrawer: () => setIsDrawerOpen(true),
		closeDrawer: () => setIsDrawerOpen(false),
	};
}

interface ChatStateProviderProps {
	children: React.ReactNode;
	isAuthenticated?: boolean;
	userId?: string;
  initialMessages?: Message[];
}

/**
 * Unified provider that works for both authenticated and unauthenticated users
 * Features are enabled/disabled based on isAuthenticated prop
 */
export function ChatStateProvider({ 
	children, 
	isAuthenticated = false,
	userId,
	initialMessages = []
}: ChatStateProviderProps) {
	// Core chat state
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "awaiting" | "error">("idle");
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [input, setInput] = useState<string>("");
	
	// Meditation-specific state
	const [meditationMode, setMeditationMode] = useState<"chat" | "meditation">("chat");
	const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);
	
	// Authentication-specific state
  const [conversationId, setConversationId] = useState<string | undefined>();
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	// Load conversation history if authenticated
	useEffect(() => {
    if (!isAuthenticated || !userId) {
      console.log("🎯 [PROVIDER] Skipping history load - not authenticated");
      return;
    }

    async function loadHistory() {
      console.log("🎯 [PROVIDER] Loading per-message history for user:", userId ?? "<none>");
      setIsLoadingHistory(true);
      try {
        const numericalUserId = Number.parseInt(userId as string, 10);
        if (Number.isNaN(numericalUserId)) {
          console.warn("🎯 [PROVIDER] Invalid userId for history load");
          return;
        }
        const history = await conversationHistory.getHistory(numericalUserId, 100);
        const mapped: Message[] = history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }) as unknown as Message);
        if (mapped.length > 0) {
          setMessages(mapped);
        }
      } catch (error) {
        console.error("🎯 [PROVIDER] Unexpected error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
        console.log("🎯 [PROVIDER] History loading complete");
      }
    }

    loadHistory();
	}, [isAuthenticated, userId]);

  // No bulk persistence here; messages are saved one by one when added.

	// Create unified state object
	const unifiedState: UnifiedChatState = {
		messages,
		status,
		setMessages,
		setStatus,
		customMessages,
		setCustomMessages,
    input,
    setInput,
    handleInputChange: (e) => {
      setInput(e.target.value);
    },
    handleSubmit: async (e) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      
      // Append user message locally
      const userMessage: Message = { id: nanoid(), role: "user", content: trimmed } as any;
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Persist per-message if authenticated
      if (isAuthenticated && userId) {
        const uid = Number.parseInt(userId, 10);
        if (!Number.isNaN(uid)) {
          conversationHistory
            .saveMessage(uid, { id: userMessage.id, role: "user", content: trimmed })
            .catch((err) => console.warn("🎯 [PROVIDER] Persist user message failed", err));
        }
      }
      
      setInput("");
      setStatus("streaming");
      
      try {
        // Call the chat API to get AI response
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: updatedMessages.map(m => ({ 
              role: m.role, 
              content: m.content 
            })) 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Handle streaming response - parse AI SDK data stream format
        let assistantContent = "";
        const assistantId = nanoid();
        
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim());
              
              for (const line of lines) {
                // AI SDK streams data in format: "0:\"text content\""
                if (line.startsWith('0:')) {
                  try {
                    // Extract JSON string after "0:"
                    const jsonStr = line.slice(2);
                    const parsed = JSON.parse(jsonStr);
                    assistantContent += parsed;
                    
                    // Update assistant message in real-time
                    setMessages((prev) => {
                      const withoutLastAssistant = prev.filter(m => m.id !== assistantId);
                      return [
                        ...withoutLastAssistant,
                        { id: assistantId, role: "assistant", content: assistantContent } as Message
                      ];
                    });
                  } catch (e) {
                    // Skip malformed chunks
                    console.warn("🎯 [PROVIDER] Failed to parse chunk:", e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
          
          // Persist assistant message if authenticated
          if (isAuthenticated && userId && assistantContent) {
            const uid = Number.parseInt(userId, 10);
            if (!Number.isNaN(uid)) {
              conversationHistory
                .saveMessage(uid, { 
                  id: assistantId, 
                  role: "assistant", 
                  content: assistantContent 
                })
                .catch((err) => console.warn("🎯 [PROVIDER] Persist assistant message failed", err));
            }
          }
        }
        
        setStatus("idle");
      } catch (error) {
        console.error("🎯 [PROVIDER] Chat API error:", error);
        setStatus("error");
        
        // Add error message
        const errorMessage: Message = {
          id: nanoid(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        } as any;
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    stop: () => {
      // no-op until streaming is implemented
    },
		isDrawerOpen,
		setIsDrawerOpen,
		isAuthenticated,
		userId,
		conversationId,
		isLoadingHistory
	};

	// Helper functions for custom messages
	const addCustomMessage = (message: ExtendedMessage) => {
		setCustomMessages((prev) => [...prev, message]);
		
    // Save message if authenticated (per-row model)
    if (isAuthenticated && userId && (message.role === "user" || message.role === "assistant")) {
      const uid = Number.parseInt(userId, 10);
      if (!Number.isNaN(uid)) {
        conversationHistory
          .saveMessage(uid, {
            id: message.id,
            role: message.role,
            content: message.content,
            audioUrl: message.audioUrl,
          })
          .catch((err) => console.warn("Error saving custom message:", err));
      }
    }
	};

	const updateCustomMessage = (id: string, updates: Partial<ExtendedMessage>) => {
		setCustomMessages((prev) => 
			prev.map((msg) => 
				msg.id === id ? { ...msg, ...updates } : msg
			)
		);

		// Update in database if authenticated
		if (isAuthenticated && userId) {
			const uid = Number.parseInt(userId, 10);
			if (!Number.isNaN(uid)) {
				setCustomMessages((prev) => {
					const updatedMessage = prev.find((msg) => msg.id === id);
					if (updatedMessage && (updatedMessage.role === "user" || updatedMessage.role === "assistant")) {
						conversationHistory
							.saveMessage(uid, {
								id: updatedMessage.id,
								role: updatedMessage.role,
								content: updatedMessage.content,
								audioUrl: updatedMessage.audioUrl,
							})
							.catch((err) => console.warn("Error updating custom message:", err));
					}
					return prev;
				});
			}
		}
	};
	
	const clearCustomMessages = () => {
		setCustomMessages([]);
	};

	// Create context value
	const contextValue: ChatContextValue = {
		chat: unifiedState,
		customMessages,
		isDrawerOpen,
		setIsDrawerOpen,
		isLoadingHistory,
		meditationMode,
		setMeditationMode,
		addCustomMessage,
		updateCustomMessage,
		clearCustomMessages,
		isGeneratingMeditation,
		setIsGeneratingMeditation,
	};

	return (
		<ChatContext.Provider value={contextValue}>
			{children}
		</ChatContext.Provider>
	);
}
