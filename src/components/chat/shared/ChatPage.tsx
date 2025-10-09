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

  // Combine and sort messages by creation time extracted from IDs
  const allMessages = [...messages, ...customMessages].sort((a, b) => {
    // Extract timestamp from ID formats:
    // - New format: "prefix-{timestamp}-{nanoid}" 
    // - Old format: "prefix-{timestamp}"
    // - Legacy format: just nanoid (no timestamp)
    const getTimestamp = (id: string): number => {
      // Match patterns like: user-1234567890123-abc, loading-1234567890123, etc.
      const timestampMatch = id.match(/-(\d{13})/); // 13 digits for millisecond timestamp
      if (timestampMatch?.[1]) {
        return Number.parseInt(timestampMatch[1], 10);
      }
      // For legacy messages without timestamps (like msg-originalmessage), use 0
      return 0;
    };
    
    const aTime = getTimestamp(a.id);
    const bTime = getTimestamp(b.id);
    
    // Sort by timestamp (messages with 0 timestamp stay at the beginning)
    return aTime - bTime;
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom instantly when messages change
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [allMessages.length, status]);

  return (
    <Chat>
      <div className="container relative z-0 mx-auto space-y-4 px-4 pt-6 pb-40 sm:px-6 md:pb-52">
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
        {/* Bottom spacer to ensure last message is always visible above chat bar */}
        <div ref={bottomRef} className="h-8" />
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

