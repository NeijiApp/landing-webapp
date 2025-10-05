import ChatPage from "~/components/chat/shared/ChatPage";

export default function ProtectedChatPage() {
  return <ChatPage isAuthenticated={true} />;
}