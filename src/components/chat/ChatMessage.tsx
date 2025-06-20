
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { User, Bot, Flag, PlusCircle, Volume2, Speaker, StopCircle } from 'lucide-react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  onFlagResponse: (messageId: string) => void;
  onAddToStudyGuide: (message: ChatMessageType) => void;
}

export function ChatMessage({ message, onFlagResponse, onAddToStudyGuide }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const avatarIcon = isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />;
  const avatarFallback = isUser ? 'U' : 'AI';

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const handleToggleAudio = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      toast({ title: "Audio Error", description: "Text-to-speech is not supported in your browser.", variant: "destructive" });
      return;
    }

    if (isPlayingAudio && utteranceRef.current) {
      speechSynthesis.cancel(); // Stop current speech
      // onend listener should set isPlayingAudio to false
    } else {
      speechSynthesis.cancel(); // Cancel any previously playing/queued speech from other messages

      const newUtterance = new SpeechSynthesisUtterance(textToSpeak);
      
      newUtterance.onstart = () => {
        setIsPlayingAudio(true);
      };
      newUtterance.onend = () => {
        setIsPlayingAudio(false);
        if (utteranceRef.current === newUtterance) { // Ensure we only nullify if it's the current one
          utteranceRef.current = null;
        }
      };
      newUtterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        toast({ title: "Audio Error", description: "Could not play audio.", variant: "destructive" });
        setIsPlayingAudio(false);
         if (utteranceRef.current === newUtterance) {
          utteranceRef.current = null;
        }
      };
      
      utteranceRef.current = newUtterance;
      speechSynthesis.speak(newUtterance);
    }
  };

  useEffect(() => {
    // Cleanup function to cancel speech synthesis when the component unmounts
    // or if the message content changes and it was speaking.
    return () => {
      if (utteranceRef.current && speechSynthesis.speaking) {
         // Check if the utterance being spoken is the one from this component instance
        if (speechSynthesis.getVoices().length > 0) { // Ensure voices are loaded before trying to match
             // This is a bit of a hack; direct comparison of utterance instance might be better
             // but cancel() is global anyway.
        }
        // Only cancel if this specific utterance is speaking.
        // However, cancel() is global, so if this component unmounts and it initiated *any* speech,
        // it might be best to cancel to avoid orphaned speech.
        // Check if the current utterance is the one speaking:
        // A more robust check would involve an ID or comparing the text,
        // but `speechSynthesis.speaking` and `utteranceRef.current` is a good heuristic.
        if(isPlayingAudio) { // Only cancel if this instance thought it was playing
            speechSynthesis.cancel();
        }

      }
      // Detach listeners to prevent memory leaks
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
    };
  }, [isPlayingAudio]); // Rerun if isPlayingAudio changes to ensure correct cleanup logic

  return (
    <div className={cn('flex items-start gap-3 my-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
      <Card className={cn('max-w-[75%] shadow-md', isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground rounded-tl-none')}>
        <CardContent className="p-3">
          {message.audio && (
            <div className="mb-2 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-accent" />
              <span>Voice query</span>
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
              <img 
                src={message.visualAid} 
                alt="AI visual aid" 
                className="object-contain rounded-md w-full max-w-[300px] h-auto max-h-[200px] mx-auto" 
              />
            </div>
          )}
        </CardContent>
        {!isUser && (
          <CardFooter className="p-2 border-t flex justify-end gap-1 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => handleToggleAudio(message.content)}
                  aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
                >
                  {isPlayingAudio ? <StopCircle className="h-4 w-4 text-destructive" /> : <Speaker className="h-4 w-4 text-muted-foreground hover:text-accent" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlayingAudio ? "Stop audio" : "Read aloud"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onFlagResponse(message.id)} aria-label="Flag response">
                  <Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flag this response</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddToStudyGuide(message)} aria-label="Add to study guide">
                  <PlusCircle className="h-4 w-4 text-muted-foreground hover:text-accent" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Study Guide</p>
              </TooltipContent>
            </Tooltip>
          </CardFooter>
        )}
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground">{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
