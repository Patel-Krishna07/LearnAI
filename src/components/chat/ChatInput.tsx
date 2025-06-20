
"use client";

import { useState, useRef, ChangeEvent, useEffect, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Paperclip, X, StopCircle, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputProps {
  onSendMessage: (text: string, imageDataUri?: string, voiceDataUri?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const { toast } = useToast();

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const processImageFile = (file: File | null) => {
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

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processImageFile(file || null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = ""; 
    }
  };

  const resetVoiceRecording = () => {
    setRecordedAudioBlob(null);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setRecordedAudioBlob(null); 
      audioChunksRef.current = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
          setRecordedAudioBlob(audioBlob);
          audioChunksRef.current = [];
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording started", description: "Click the mic again to stop." });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({ title: "Microphone Error", description: "Could not access microphone. Please check permissions.", variant: "destructive" });
        setIsRecording(false);
      }
    }
  };
  
  const handleSend = async () => {
    if (!text.trim() && !imageFile && !recordedAudioBlob) {
      toast({ title: "Cannot send empty message", description: "Please type a message, upload an image, or record audio.", variant: "destructive" });
      return;
    }

    if (isRecording) {
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.onstop = async () => { 
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

            const voiceDataUri = await blobToDataURI(audioBlob);
            const currentImageDataUri = imageFile ? await blobToDataURI(imageFile) : undefined;
            onSendMessage(text.trim(), currentImageDataUri, voiceDataUri);
            
            setText('');
            removeImage();
            setRecordedAudioBlob(null);
            setIsRecording(false);
        };
        mediaRecorderRef.current.stop();
        return; 
      }
    }
    
    let imageDataUri: string | undefined = undefined;
    if (imageFile) {
      imageDataUri = await blobToDataURI(imageFile);
    }

    let voiceDataUri: string | undefined = undefined;
    if (recordedAudioBlob) {
      voiceDataUri = await blobToDataURI(recordedAudioBlob);
    }
    
    onSendMessage(text.trim(), imageDataUri, voiceDataUri);
    setText('');
    removeImage();
    setRecordedAudioBlob(null);
  };

  const blobToDataURI = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to convert blob to Data URI"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading && !isRecording) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (isLoading || isRecording) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        toast({ title: "Invalid file type", description: "Please drop an image file.", variant: "destructive" });
      }
      event.dataTransfer.clearData();
    }
  };

  const canSend = !isLoading && (!!text.trim() || !!imageFile || !!recordedAudioBlob || isRecording);

  return (
    <div 
      className={cn(
        "p-4 border-t bg-background shadow- ऊपर relative",
        isDraggingOver && "border-primary ring-2 ring-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center pointer-events-none rounded-md">
          <UploadCloud className="h-12 w-12 text-primary mb-2" />
          <p className="text-primary font-medium">Drop image here</p>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 relative w-32 h-32 border rounded-md overflow-hidden">
          <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 z-10"
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove image</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
       {recordedAudioBlob && !isRecording && (
        <div className="mb-2 p-2 border rounded-md flex items-center justify-between bg-secondary">
          <span className="text-sm text-secondary-foreground">Voice message ready</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setRecordedAudioBlob(null)} aria-label="Remove voice message">
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove voice message</p>
            </TooltipContent>
          </Tooltip>
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
            if (e.key === 'Enter' && !e.shiftKey && canSend) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Chat message input"
          disabled={isLoading}
        />
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          onChange={handleImageChange} 
          className="hidden"
          id="image-upload"
          disabled={isLoading || isRecording}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => imageInputRef.current?.click()} 
              disabled={isLoading || isRecording} 
              aria-label="Upload image"
            >
              <Paperclip className="h-5 w-5 text-accent" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Attach image</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleMicToggle} 
              disabled={isLoading} 
              aria-label={isRecording ? "Stop recording" : "Record voice message"}
              className={isRecording ? "text-red-500" : "text-accent"}
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRecording ? "Stop recording" : "Record voice message"}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSend} disabled={!canSend} size="icon" aria-label="Send message">
              <Send className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send message</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {isRecording && (
        <p className="text-xs text-red-500 mt-1 text-center">Recording audio...</p>
      )}
    </div>
  );
}
