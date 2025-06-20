
"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageSquareText, Trash2, History } from 'lucide-react'; // Changed FileText to MessageSquareText
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHistoryPanelProps {
  currentChatMessages: ChatMessageType[]; // Expecting user messages from the current chat
  onSelectHistoryItem: (messageId: string) => void;
  onClearHistory: () => void;
}

export function ChatHistoryPanel({ currentChatMessages, onSelectHistoryItem, onClearHistory }: ChatHistoryPanelProps) {
  // Filter to ensure we only consider user messages and they have content
  const historyItems = currentChatMessages
    .filter(msg => msg.role === 'user' && msg.content.trim() !== '')
    .map(msg => ({
      id: msg.id,
      title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''), // Truncate long messages
      timestamp: msg.timestamp,
    }))
    .reverse(); // Show newest first

  if (historyItems.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <History className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">No Chat History</p>
        <p className="text-sm text-muted-foreground">Your questions will appear here as you chat.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-1">
      <div className="p-3 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold font-headline">Current Conversation</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClearHistory} aria-label="Clear history" disabled={historyItems.length === 0}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear Current History</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {historyItems.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:bg-primary/10 transition-colors" // Changed hover style
              onClick={() => onSelectHistoryItem(item.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectHistoryItem(item.id)}
              aria-label={`Chat query: ${item.title}, from ${formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}`}
            >
              <CardHeader className="p-3">
                <div className="flex items-start gap-3">
                  <MessageSquareText className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <CardTitle className="text-sm font-medium truncate" title={item.title}>{item.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
