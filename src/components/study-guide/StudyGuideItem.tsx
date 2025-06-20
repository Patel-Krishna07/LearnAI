
"use client";

import type { StudyGuideEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit3, CheckSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StudyGuideItemProps {
  entry: StudyGuideEntry;
  onDelete: (id: string) => void;
  // onEdit: (entry: StudyGuideEntry) => void; // Future: for editing entries
}

export function StudyGuideItem({ entry, onDelete }: StudyGuideItemProps) {
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-start gap-3">
           <FileText className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
           <div>
            <CardTitle className="text-lg font-headline leading-tight">{entry.question}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Saved on: {format(new Date(entry.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-3 bg-secondary rounded-md border border-dashed">
          <h4 className="font-semibold mb-1 text-primary flex items-center gap-1">
            <CheckSquare className="h-4 w-4" /> AI Summary:
          </h4>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{entry.aiSummary}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => onEdit(entry)} aria-label="Edit entry">
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit this entry</p>
          </TooltipContent>
        </Tooltip> */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="destructive" size="sm" onClick={() => onDelete(entry.id)} aria-label="Delete entry">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete this entry</p>
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}
