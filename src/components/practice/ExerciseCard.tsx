
"use client";

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import type { PracticeExercise } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExerciseCardProps {
  exercise: PracticeExercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-headline">
          <HelpCircle className="h-6 w-6 text-accent" />
          Question {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-md mb-4">{exercise.question}</p>
        {showAnswer && (
          <div className="p-3 bg-secondary rounded-md border border-dashed">
            <h4 className="font-semibold mb-1 text-primary">Answer:</h4>
            <p className="text-sm text-foreground/80">{exercise.answer}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => setShowAnswer(!showAnswer)} className="w-full">
              {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showAnswer ? 'Hide the answer' : 'Reveal the answer'}</p>
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}
