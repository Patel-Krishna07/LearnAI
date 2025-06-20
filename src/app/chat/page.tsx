
"use client";

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { FlagResponseDialog } from '@/components/chat/FlagResponseDialog';
import { ChatHistoryPanel } from '@/components/chat/ChatHistoryPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PanelRightOpen, PanelRightClose, Bot, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageType, StudyGuideEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { multimodalQuery } from '@/ai/flows/multimodal-query';
import { createStudyGuideEntry as createStudyGuideEntryFlow } from '@/ai/flows/ai-study-guide';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';


export default function ChatPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true);
  
  const [flaggingResponse, setFlaggingResponse] = useState<{ id: string; query: string } | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/chat');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);
  
  // Add initial greeting message from AI
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      setMessages([
        {
          id: 'initial-greeting',
          role: 'assistant',
          content: "Hello! I'm LearnAI, your interactive learning assistant. How can I help you today? You can ask me questions, upload an image, or even use voice!",
          timestamp: new Date(),
        }
      ]);
    }
  }, [isAuthenticated, messages.length]);


  const handleSendMessage = async (text: string, imageDataUri?: string, voiceDataUri?: string) => {
    if (!text && !imageDataUri && !voiceDataUri) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      image: imageDataUri,
      audio: voiceDataUri,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await multimodalQuery({
        textQuery: text,
        imageDataUri: imageDataUri,
        voiceDataUri: voiceDataUri,
      });

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        visualAid: aiResponse.visualAid,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling multimodalQuery:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI. Please try again.',
        variant: 'destructive',
      });
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagResponse = (messageId: string) => {
    const messageToFlag = messages.find(msg => msg.id === messageId && msg.role === 'assistant');
    // Find the preceding user query for context
    let userQuery = "Could not find original query.";
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userQuery = messages[i].content;
          if (messages[i].image) userQuery += " (with image)";
          if (messages[i].audio) userQuery += " (with audio)";
          break;
        }
      }
    }
    if (messageToFlag) {
      setFlaggingResponse({ id: messageId, query: userQuery });
    }
  };

  const handleAddToStudyGuide = async (messageToSave: ChatMessageType) => {
    // Find the user query that led to this AI response
    const aiResponseIndex = messages.findIndex(msg => msg.id === messageToSave.id);
    let userQueryMessage: ChatMessageType | undefined;
    if (aiResponseIndex > 0) {
      for (let i = aiResponseIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userQueryMessage = messages[i];
          break;
        }
      }
    }

    if (!userQueryMessage) {
      toast({ title: "Error", description: "Could not find the original question for this summary.", variant: "destructive" });
      return;
    }
    
    const questionText = userQueryMessage.content + 
                         (userQueryMessage.image ? " [Image attached]" : "") + 
                         (userQueryMessage.audio ? " [Audio attached]" : "");

    try {
      setIsLoading(true); // You might want a specific loading state for this action
      const result = await createStudyGuideEntryFlow({
        question: questionText,
        aiSummary: messageToSave.content,
      });
      
      // In a real app, you'd save `result.studyGuideEntry` to a user's study guide list (e.g., in localStorage or a database)
      // For this example, we'll just show a toast.
      const studyGuides = JSON.parse(localStorage.getItem('studyGuideEntries') || '[]');
      studyGuides.push({ 
        id: Date.now().toString(), 
        question: questionText, 
        aiSummary: messageToSave.content, 
        createdAt: new Date(),
        fullEntry: result.studyGuideEntry 
      });
      localStorage.setItem('studyGuideEntries', JSON.stringify(studyGuides));
      
      toast({
        title: 'Added to Study Guide',
        description: `"${questionText.substring(0,30)}..." saved.`,
      });
    } catch (error) {
      console.error('Error creating study guide entry:', error);
      toast({ title: 'Error', description: 'Failed to add to study guide.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (itemId: string) => {
    // Placeholder: Load chat history item
    toast({ title: "Load History", description: `Loading chat history item ${itemId} (not implemented).` });
  };

  const handleClearHistory = () => {
    // Placeholder: Clear chat history
    toast({ title: "Clear History", description: "Chat history cleared (not implemented)." });
    // setMessages([]); // If history is stored in `messages`
  };
  
  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Sparkles className="h-12 w-12 text-accent animate-spin" /> 
          <p className="ml-4 text-xl text-muted-foreground">Loading your learning space...</p>
        </div>
      </AppShell>
    );
  }
  
  if (!isAuthenticated) {
     // This case should ideally be handled by redirect in useEffect, but as a fallback:
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
           <p className="text-xl text-muted-foreground">Please log in to access the chat.</p>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] border rounded-lg shadow-lg overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-card">
          <header className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              <h2 className="text-xl font-semibold font-headline">LearnAI Chat</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)}
              aria-label={isHistoryPanelOpen ? "Close history panel" : "Open history panel"}
            >
              {isHistoryPanelOpen ? <PanelRightClose className="h-5 w-5 text-accent" /> : <PanelRightOpen className="h-5 w-5 text-accent" />}
            </Button>
          </header>
          
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onFlagResponse={handleFlagResponse}
                onAddToStudyGuide={handleAddToStudyGuide}
              />
            ))}
            {isLoading && messages[messages.length -1]?.role === 'user' && (
               <div className="flex items-start gap-3 my-4 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                  </Avatar>
                  <Card className="max-w-[75%] bg-card text-card-foreground rounded-tl-none animate-pulse">
                    <CardContent className="p-3 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
              </div>
            )}
          </ScrollArea>
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>

        {/* Chat History Panel (Collapsible) */}
        {isHistoryPanelOpen && (
          <div className="w-full md:w-80 lg:w-96 border-l bg-secondary transition-all duration-300 ease-in-out">
            <ChatHistoryPanel 
              onSelectHistoryItem={handleSelectHistoryItem}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}
      </div>

      {flaggingResponse && (
        <FlagResponseDialog
          isOpen={!!flaggingResponse}
          onOpenChange={(open) => !open && setFlaggingResponse(null)}
          responseId={flaggingResponse.id}
          query={flaggingResponse.query}
        />
      )}
    </AppShell>
  );
}
