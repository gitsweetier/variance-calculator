import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata = {
  title: 'Variance Expert - Poker Variance Calculator',
  description: 'Chat with an AI expert about poker variance and run simulations',
};

export default function ChatPage() {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <ChatInterface />
      </div>
    </main>
  );
}
