"use client";

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { User, Bot, Flag, PlusCircle, Image as ImageIcon, Volume2 } from 'lucide-react';
import Image from 'next/image';

interface ChatMessageProps {
  message: ChatMessageType;
  onFlagResponse: (messageId: string) => void;
  onAddToStudyGuide: (message: ChatMessageType) => void;
}

export function ChatMessage({ message, onFlagResponse, onAddToStudyGuide }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const avatarIcon = isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />;
  const avatarFallback = isUser ? 'U' : 'AI';

  return (
    <div className={cn('flex items-start gap-3 my-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          {/* Placeholder for AI avatar image if available */}
          {/* <AvatarImage src="/ai-avatar.png" alt="AI Avatar" /> */}
          <AvatarFallback className="bg-primary text-primary-foreground">{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
      <Card className={cn('max-w-[75%] shadow-md', isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground rounded-tl-none')}>
        <CardContent className="p-3">
          {message.audio && (
            <div className="mb-2 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-accent" />
              <span>Voice query</span>
              {/* In a real app, you would play the audio here */}
            </div>
          )}
          {message.image && (
            <div className="mb-2 rounded-md overflow-hidden border" data-ai-hint="abstract query">
              <Image src={message.image} alt="User query image" width={200} height={150} className="object-cover" />
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.visualAid && (
            <div className="mt-3 p-2 border rounded-md bg-background" data-ai-hint="chart diagram">
              <Image src={message.visualAid} alt="AI visual aid" width={300} height={200} className="object-contain rounded-md" />
            </div>
          )}
        </CardContent>
        {!isUser && (
          <CardFooter className="p-2 border-t flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onFlagResponse(message.id)} aria-label="Flag response">
              <Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddToStudyGuide(message)} aria-label="Add to study guide">
              <PlusCircle className="h-4 w-4 text-muted-foreground hover:text-accent" />
            </Button>
          </CardFooter>
        )}
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          {/* Placeholder for user avatar image if available */}
          {/* <AvatarImage src={user?.image} alt="User Avatar" /> */}
          <AvatarFallback className="bg-accent text-accent-foreground">{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
