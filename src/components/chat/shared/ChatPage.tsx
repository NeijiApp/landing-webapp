"use client";

import { Focus, Moon, Sunrise, Target } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { AuthErrorBoundary } from "~/components/AuthErrorBoundary";
import { cn } from "~/lib/utils";
import { BotMessage } from "./bot-message";
import { Chat } from "./chat";
import { EnhancedChatInput } from "./enhanced-chat-input";
import { GradientBackground } from "./gradient-background";
import {
  ChatStateProvider,
  mergeMessages,
  useChatState,
  useDrawer,
} from "./unified-provider";
import { UserMessage } from "./user-message";

interface ChatPageProps {
  isAuthenticated?: boolean;
  userId?: string;
  initialMessages?: any[];
}

const QUICK_STARTS = [
  { goal: "sleep", label: "Sleep", line: "Help me fall asleep", icon: Moon },
  { goal: "focus", label: "Focus", line: "Help me focus", icon: Focus },
  { goal: "calm", label: "Calm", line: "Help me calm down", icon: Target },
  { goal: "morning", label: "Morning", line: "Help me start my morning", icon: Sunrise },
] as const;

/**
 * Opens the sign-in drawer for /chat?signin=true. It reads the query string,
 * so it sits in its own Suspense boundary and the rest of the page is in the
 * server HTML.
 */
function SigninParamWatcher({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { openDrawer } = useDrawer();
  const searchParams = useSearchParams();

  useEffect(() => {
    const signinParam = searchParams.get("signin");

    if (signinParam === "true" && !isAuthenticated) {
      openDrawer();

      // Clean up the URL parameter after opening drawer
      const url = new URL(window.location.href);
      url.searchParams.delete("signin");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, isAuthenticated, openDrawer]);

  return null;
}

function ChatLogic({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const {
    chat: { messages, status },
    customMessages,
    meditationMode,
    isGeneratingMeditation,
    startMeditationFlow,
    chooseOption,
    cancelMeditation,
    retryMeditation,
  } = useChatState();

  const allMessages = mergeMessages(messages, customMessages);
  const isStreaming = status === "streaming" || status === "submitted";
  const busy = isStreaming || isGeneratingMeditation;
  const panelOpen = meditationMode === "meditation";

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // True while the reader is at the bottom of the conversation.
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const onScroll = () => {
      const distance =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      stickToBottomRef.current = distance < 160;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A new message, a new state or the panel opening: go to the bottom.
  useEffect(() => {
    if (allMessages.length === 0) return;
    stickToBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [allMessages.length, status, isGeneratingMeditation, panelOpen]);

  // The list also grows without a new message (text being typed out, choice
  // buttons, the audio player appearing). Follow it while the reader is at
  // the bottom.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <Chat>
      <div
        ref={listRef}
        className={cn(
          "container relative z-0 mx-auto space-y-4 px-4 pt-6 sm:px-6",
          // The open Meditation Mode panel is 310 px high. Leave room so the
          // last message, the waiting animation and the player stay above it.
          panelOpen ? "pb-[350px]" : "pb-40 md:pb-52",
        )}
      >
        {allMessages.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-5 text-center",
              panelOpen ? "min-h-[30vh]" : "min-h-[60vh]",
            )}
          >
            <Image src="/logo-neiji-full.png" alt="Neiji" width={96} height={96} />
            <p className="mx-auto max-w-sm text-base text-gray-700">
              Choose what you need and I will make a guided meditation for you.
            </p>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              {QUICK_STARTS.map(({ goal, label, line, icon: Icon }) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => startMeditationFlow(goal, { userLine: line })}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-orange-300 bg-white/80 px-4 py-2 font-medium text-orange-700 shadow-sm transition-colors hover:border-orange-500 hover:bg-orange-50 active:scale-[0.98]"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">Or tell me how you feel.</p>
          </div>
        ) : (
          allMessages.map((message, index) => {
            if (message.role === "user") {
              return <UserMessage key={message.id}>{message.content}</UserMessage>;
            }

            const isLast = index === allMessages.length - 1;

            // A reply is shown once it is complete, then typed out.
            if (isStreaming && isLast && !message.audioUrl && !message.isGeneratingMeditation) {
              return null;
            }

            return (
              <BotMessage
                key={message.id}
                message={message}
                isLast={isLast}
                busy={busy}
                onChoose={(choice) => chooseOption(message.id, choice)}
                onCancel={() => cancelMeditation(message.id)}
                onRetry={() => retryMeditation(message.id)}
              />
            );
          })
        )}
        {isStreaming && (
          <div
            role="status"
            aria-label="Neiji is writing"
            className="flex w-fit items-center gap-1.5 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-3 shadow"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-pulse rounded-full bg-white"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}
        {/* Bottom spacer to ensure last message is always visible above chat bar */}
        <div ref={bottomRef} className="h-8" />
      </div>
      <EnhancedChatInput isAuthenticated={isAuthenticated} />
    </Chat>
  );
}

export default function ChatPage({
  isAuthenticated = false,
  userId,
  initialMessages = [],
}: ChatPageProps) {
  return (
    <GradientBackground>
      <AuthErrorBoundary>
        <ChatStateProvider
          isAuthenticated={isAuthenticated}
          userId={userId}
          initialMessages={initialMessages}
        >
          <Suspense fallback={null}>
            <SigninParamWatcher isAuthenticated={isAuthenticated} />
          </Suspense>
          <ChatLogic isAuthenticated={isAuthenticated} />
        </ChatStateProvider>
      </AuthErrorBoundary>
    </GradientBackground>
  );
}
