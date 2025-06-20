"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { FlagResponseSchema, type FlagResponseFormData } from '@/lib/schemas';
import { flagIncompleteResponse } from '@/ai/flows/flag-incomplete-response';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface FlagResponseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: string;
  query: string;
}

export function FlagResponseDialog({ isOpen, onOpenChange, responseId, query }: FlagResponseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FlagResponseFormData>({
    resolver: zodResolver(FlagResponseSchema),
    defaultValues: {
      reason: '',
    },
  });

  async function onSubmit(data: FlagResponseFormData) {
    setIsSubmitting(true);
    try {
      const result = await flagIncompleteResponse({
        responseId,
        reason: data.reason,
        query,
      });
      if (result.success) {
        toast({
          title: 'Response Flagged',
          description: 'Thank you for your feedback. Administrators will review this response.',
        });
        form.reset();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Flagging Response',
          description: result.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error flagging response:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Flag AI Response</DialogTitle>
          <DialogDescription>
            Please provide a reason why this response is incomplete or inaccurate. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reason">Reason for flagging</FormLabel>
                  <FormControl>
                    <Textarea
                      id="reason"
                      placeholder="e.g., The explanation was unclear, the information was incorrect, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
