"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { BotMessage } from "./bot-message";
import { Chat } from "./chat";
import { EnhancedChatInput } from "./enhanced-chat-input";
import { GradientBackground } from "./gradient-background";
import { UserMessage } from "./user-message";
import { ChatStateProvider, useChatState, useDrawer } from "./unified-provider";
import { AuthErrorBoundary } from "~/components/AuthErrorBoundary";

interface ChatPageProps {
  isAuthenticated?: boolean;
  userId?: string;
  initialMessages?: any[];
}

function ChatLogic({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const {
    chat: { messages, status, setMessages },
    customMessages,
  } = useChatState();
  
  const { openDrawer } = useDrawer();
  const searchParams = useSearchParams();
  
  // Check if signin parameter is present and open drawer
  useEffect(() => {
    const signinParam = searchParams.get('signin');
    
    if (signinParam === 'true' && !isAuthenticated) {
      // Open drawer immediately
      openDrawer();
      
      // Clean up the URL parameter after opening drawer
      const url = new URL(window.location.href);
      url.searchParams.delete('signin');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, isAuthenticated, openDrawer]);

  // Combine and sort messages by creation time
  // Extract timestamp from IDs or use a sequential order
  const allMessages = [...messages, ...customMessages].sort((a, b) => {
    // Try to extract timestamp from ID formats:
    // - Regular nanoid: no timestamp, use 0
    // - Timestamp-based: "prefix-{timestamp}" or "prefix-{timestamp}-suffix"
    const getTimestamp = (id: string): number => {
      // Match patterns like: user-1234567890, meditation-1234567890, loading-1234567890, error-1234567890
      const timestampMatch = id.match(/-(\d{13,})/); // 13+ digits for millisecond timestamp
      if (timestampMatch) {
        return Number.parseInt(timestampMatch[1], 10);
      }
      // For messages without timestamps, return 0 (they appear first)
      return 0;
    };
    
    const aTime = getTimestamp(a.id);
    const bTime = getTimestamp(b.id);
    
    // If both have no timestamp (0), maintain original order
    if (aTime === 0 && bTime === 0) return 0;
    // Messages with timestamps come after those without
    if (aTime === 0) return -1;
    if (bTime === 0) return 1;
    // Sort by timestamp
    return aTime - bTime;
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [allMessages.length, status]);

  return (
    <Chat>
      <div className="container relative z-0 mx-auto space-y-4 px-4 pt-6 sm:px-6">
        {allMessages.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <Image src="/logo-neiji-full.png" alt="Neiji Logo" width={96} height={96} />
            <p className="mx-auto max-w-md px-4 text-base text-muted-foreground">
              I'm your coach for self development, Soonly sharing tailored mindfulness.
            </p>
          </div>
        ) : (
          allMessages.map((message, index) => {
            if (message.role === "user") {
              return <UserMessage key={message.id}>{message.content}</UserMessage>;
            }

            if (status === "streaming" && index === allMessages.length - 1 && !("audioUrl" in message)) {
              return null;
            }

            return <BotMessage key={message.id} message={message} />;
          })
        )}
        <div ref={bottomRef} />
      </div>
      <EnhancedChatInput
        isAuthenticated={isAuthenticated}
        onChatFocus={() => {
          if (allMessages.length === 0) {
            setMessages([
              {
                id: "msg-originalmessage",
                content: "Hey ! What is the one thing you want to improve in your life today ?",
                role: "assistant",
              },
            ]);
          }
        }}
      />
    </Chat>
  );
}

export default function ChatPage({
  isAuthenticated = false,
  userId,
  initialMessages = []
}: ChatPageProps) {
  return (
    <GradientBackground>
      <AuthErrorBoundary>
        <ChatStateProvider
          isAuthenticated={isAuthenticated}
          userId={userId}
          initialMessages={initialMessages}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <ChatLogic isAuthenticated={isAuthenticated} />
          </Suspense>
        </ChatStateProvider>
      </AuthErrorBoundary>
    </GradientBackground>
  );
}

