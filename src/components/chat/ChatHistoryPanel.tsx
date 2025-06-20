"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, History } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Mock data for chat history items
// In a real app, this would come from state/API
const mockHistoryItems = [
  { id: '1', title: 'Photosynthesis basics', date: '2024-07-28' },
  { id: '2', title: 'Quantum Physics intro', date: '2024-07-27' },
  { id: '3', title: 'Shakespearean Sonnets', date: '2024-07-26' },
  { id: '4', title: 'World War II causes', date: '2024-07-25' },
];

interface ChatHistoryPanelProps {
  onSelectHistoryItem: (itemId: string) => void;
  onClearHistory: () => void;
}

export function ChatHistoryPanel({ onSelectHistoryItem, onClearHistory }: ChatHistoryPanelProps) {
  // For now, we'll use mock data.
  const historyItems = mockHistoryItems; 

  if (historyItems.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <History className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">No Chat History</p>
        <p className="text-sm text-muted-foreground">Your conversations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-1">
      <div className="p-3 flex justify-between items-center border-b">
        <h3 className="text-lg font-semibold font-headline">Chat History</h3>
        <Button variant="ghost" size="icon" onClick={onClearHistory} aria-label="Clear history" disabled={historyItems.length === 0}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {historyItems.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => onSelectHistoryItem(item.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectHistoryItem(item.id)}
              aria-label={`Chat: ${item.title}, dated ${item.date}`}
            >
              <CardHeader className="p-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div className="flex-grow">
                    <CardTitle className="text-sm font-medium truncate">{item.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{item.date}</CardDescription>
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
