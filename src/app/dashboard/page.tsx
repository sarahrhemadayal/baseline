import { PageHeader } from './components/page-header';
import { ChatInterface } from './components/chat-interface';

export default function DashboardPage() {
  return (
    // The height is calculated to fill the viewport minus the header height.
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="Chat with your Career Assistant"
        description="Log your daily progress. You can share text, voice notes, or upload documents."
      />
      <ChatInterface />
    </div>
  );
}
