"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Image as ImageIcon, Send, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (text: string, imageDataUri?: string, voiceDataUri?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Voice input state and logic would go here
  // const [isRecording, setIsRecording] = useState(false);

  const { toast } = useToast();

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = ""; // Reset file input
    }
  };
  
  const handleSend = async () => {
    if (!text.trim() && !imageFile) { // Add !voiceFile when implemented
      toast({ title: "Cannot send empty message", description: "Please type a message, upload an image, or record audio.", variant: "destructive" });
      return;
    }

    let imageDataUri: string | undefined = undefined;
    if (imageFile) {
      imageDataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }
    
    // Placeholder for voiceDataUri
    onSendMessage(text.trim(), imageDataUri, undefined);
    setText('');
    removeImage();
  };

  const handleVoiceInput = () => {
    // Placeholder for voice input functionality
    toast({ title: "Voice Input", description: "Voice input is not implemented yet." });
    // setIsRecording(!isRecording);
    // Logic for starting/stopping recording and converting to data URI
  };


  return (
    <div className="p-4 border-t bg-background shadow- ऊपर">
      {imagePreview && (
        <div className="mb-2 relative w-32 h-32 border rounded-md overflow-hidden">
          <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={removeImage}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Type your message or describe your image/audio..."
          className="flex-1 resize-none min-h-[52px] max-h-[200px] rounded-lg shadow-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Chat message input"
        />
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          onChange={handleImageChange} 
          className="hidden"
          id="image-upload"
        />
        <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isLoading} aria-label="Upload image">
          <Paperclip className="h-5 w-5 text-accent" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleVoiceInput} disabled={isLoading} aria-label="Record voice message">
          <Mic className="h-5 w-5 text-accent" />
        </Button>
        <Button onClick={handleSend} disabled={isLoading || (!text.trim() && !imageFile)} size="icon" aria-label="Send message">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
