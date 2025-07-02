
"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel as ShadFormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Lightbulb, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { generateQuiz, type GenerateQuizInput, type QuizQuestion, type McqQuestion, type TrueFalseQuestion, type FillBlankQuestion } from '@/ai/flows/generate-quiz-flow';
import { cn } from '@/lib/utils';
import { POINTS_FOR_QUIZ_QUESTION_CORRECT } from '@/lib/constants';

const QuizTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(3, 'Must have at least 3 questions.').max(10, 'Cannot have more than 10 questions.').default(5),
});
type QuizTopicFormData = z.infer<typeof QuizTopicSchema>;

// Individual Question Components

const McqQuestionComponent = ({ question, onCorrect }: { question: McqQuestion, onCorrect: () => void }) => {
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSelectAnswer = (selectedIndex: number) => {
    if (selectedAnswerIndex !== null) return;
    setSelectedAnswerIndex(selectedIndex);
    const isCorrect = selectedIndex === question.correctAnswerIndex;
    if (isCorrect) {
      onCorrect();
      toast({ title: 'Correct!', description: `You earned ${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP points!` });
    } else {
      toast({ title: 'Not quite', description: 'Try another question!', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{question.question}</CardTitle>
        <CardDescription>Select one of the following options.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswerIndex === index;
          const isCorrect = question.correctAnswerIndex === index;
          const hasBeenAnswered = selectedAnswerIndex !== null;
          return (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleSelectAnswer(index)}
              disabled={hasBeenAnswered}
              className={cn(
                "justify-start text-left h-auto py-2",
                hasBeenAnswered && isCorrect && "border-green-500 bg-green-500/10 text-green-700 hover:bg-green-500/20",
                hasBeenAnswered && !isCorrect && isSelected && "border-red-500 bg-red-500/10 text-red-700 hover:bg-red-500/20",
                "disabled:opacity-100 disabled:cursor-not-allowed"
              )}
            >
              {option}
              {hasBeenAnswered && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />}
              {hasBeenAnswered && !isCorrect && isSelected && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

const TrueFalseComponent = ({ question, onCorrect }: { question: TrueFalseQuestion, onCorrect: () => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleSelect = (answer: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    if (answer === question.isTrue) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP!` });
    } else {
      toast({ title: 'Incorrect!', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{question.statement}</CardTitle>
        <CardDescription>Is this statement True or False?</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4 justify-center">
        {[true, false].map(val => {
          const isSelected = selectedAnswer === val;
          const isCorrect = question.isTrue === val;
          const hasBeenAnswered = selectedAnswer !== null;
          return (
            <Button
              key={String(val)}
              onClick={() => handleSelect(val)}
              disabled={hasBeenAnswered}
              className={cn("w-24", hasBeenAnswered && isCorrect && "border-green-500 bg-green-500/10 text-green-700", hasBeenAnswered && !isCorrect && isSelected && "border-red-500 bg-red-500/10 text-red-700", "disabled:opacity-100 disabled:cursor-not-allowed")}
            >
              {val ? "True" : "False"}
              {hasBeenAnswered && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5" />}
              {hasBeenAnswered && !isCorrect && isSelected && <XCircle className="ml-auto h-5 w-5" />}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
};

const FillBlankComponent = ({ question, onCorrect }: { question: FillBlankQuestion, onCorrect: () => void }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleCheckAnswer = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    if (userAnswer.trim().toLowerCase() === question.answer.toLowerCase()) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', description: `The correct answer was: ${question.answer}`, variant: 'destructive' });
    }
  };

  const questionParts = question.question.split('[BLANK]');

  return (
    <Card className="shadow-md">
       <CardHeader>
        <CardTitle className="font-headline text-lg">Fill in the blank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-md">
          <span>{questionParts[0]}</span>
          <Input 
            type="text" 
            placeholder="Your answer" 
            value={userAnswer} 
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
            disabled={isSubmitted}
            className={cn("w-36 h-8", isSubmitted && (userAnswer.trim().toLowerCase() === question.answer.toLowerCase() ? "border-green-500" : "border-red-500"))}
          />
          <span>{questionParts[1]}</span>
        </div>
        {isSubmitted && userAnswer.trim().toLowerCase() !== question.answer.toLowerCase() && (
          <p className="text-sm text-red-500">Correct answer: <strong>{question.answer}</strong></p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleCheckAnswer} disabled={isSubmitted}>Check Answer</Button>
      </CardFooter>
    </Card>
  )
}

export default function QuizPage() {
  const { isAuthenticated, loading: authLoading, addPoints } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<QuizTopicFormData>({
    resolver: zodResolver(QuizTopicSchema),
    defaultValues: { topic: '', numQuestions: 5 },
  });

  const onSubmit = async (data: QuizTopicFormData) => {
    setIsLoading(true);
    setQuiz([]);
    try {
      const result = await generateQuiz({ topic: data.topic, numQuestions: data.numQuestions });
      if (result.questions && result.questions.length > 0) {
        setQuiz(result.questions);
      } else {
        toast({ title: 'No quiz generated', description: 'The AI could not generate a quiz for this topic. Please try another one.' });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({ title: 'Error', description: 'Failed to generate quiz. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Sparkles className="h-12 w-12 text-accent animate-spin" />
          <p className="ml-4 text-xl text-muted-foreground">Loading quiz area...</p>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    router.push('/login?redirect=/quiz');
    return null; // or a loading skeleton
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <ListChecks className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 font-headline">Topic Quiz Generator</h1>
          <p className="text-lg text-muted-foreground">
            Challenge yourself with a mix of questions on any topic.
          </p>
        </header>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Generate a New Quiz</CardTitle>
            <CardDescription>Enter a topic and the number of questions you want.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <ShadFormLabel htmlFor="topic">Topic</ShadFormLabel>
                      <FormControl>
                        <Input id="topic" placeholder="e.g., The Roman Empire, Quantum Physics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <ShadFormLabel htmlFor="numQuestions">Number of Questions (3-10)</ShadFormLabel>
                      <FormControl>
                        <Input id="numQuestions" type="number" min="3" max="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Quiz'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(form.getValues("numQuestions"))].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        )}

        {quiz.length > 0 && (
           <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-6 text-center font-headline">
              Your Quiz on &quot;{form.getValues("topic")}&quot;
            </h2>
            {quiz.map((q, index) => {
              const key = `${q.type}-${index}`;
              switch (q.type) {
                case 'MCQ':
                  return <McqQuestionComponent key={key} question={q} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />;
                case 'TRUE_FALSE':
                  return <TrueFalseComponent key={key} question={q} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />;
                case 'FILL_BLANK':
                  return <FillBlankComponent key={key} question={q} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />;
                default:
                  return null;
              }
            })}
          </div>
        )}

        {!isLoading && quiz.length === 0 && form.formState.isSubmitted && (
           <Card className="text-center p-8 bg-secondary">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl font-headline mb-2">No Quiz Yet</CardTitle>
            <CardDescription>
              The AI couldn&apos;t generate a quiz for that topic. Please try being more specific or try a different topic.
            </CardDescription>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
