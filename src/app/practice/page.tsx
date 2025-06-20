
"use client";

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseCard } from '@/components/practice/ExerciseCard';
import { useToast } from '@/hooks/use-toast';
import { generatePracticeExercises } from '@/ai/flows/generate-practice-exercises';
import type { PracticeExercise as PracticeExerciseType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel as ShadFormLabel } from '@/components/ui/form';
import { PracticeTopicSchema, type PracticeTopicFormData } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenSquare, Lightbulb, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function PracticePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exercises, setExercises] = useState<PracticeExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/practice');
    }
  }, [isAuthenticated, authLoading, router]);

  const form = useForm<PracticeTopicFormData>({
    resolver: zodResolver(PracticeTopicSchema),
    defaultValues: {
      topic: '',
      numQuestions: 5,
    },
  });

  async function onSubmit(data: PracticeTopicFormData) {
    setIsLoading(true);
    setExercises([]); // Clear previous exercises
    try {
      const result = await generatePracticeExercises({
        topic: data.topic,
        numQuestions: data.numQuestions,
      });
      
      if (result.questions && result.answers && result.questions.length === result.answers.length) {
        const newExercises = result.questions.map((q, i) => ({
          id: `${data.topic}-${i}-${Date.now()}`,
          question: q,
          answer: result.answers[i],
        }));
        setExercises(newExercises);
        if(newExercises.length === 0) {
          toast({ title: 'No exercises generated', description: 'The AI could not generate exercises for this topic. Try a different one.', variant: 'default' });
        } else {
           toast({ title: 'Exercises Generated!', description: `Here are ${newExercises.length} exercises on "${data.topic}".` });
        }
      } else {
        throw new Error("AI response was not in the expected format.");
      }

    } catch (error) {
      console.error('Error generating practice exercises:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate exercises. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Sparkles className="h-12 w-12 text-accent animate-spin" /> 
          <p className="ml-4 text-xl text-muted-foreground">Loading practice area...</p>
        </div>
      </AppShell>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
           <p className="text-xl text-muted-foreground">Please log in to access practice exercises.</p>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <PenSquare className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 font-headline">Practice Exercises</h1>
          <p className="text-lg text-muted-foreground">
            Test your understanding with AI-generated questions on any topic.
          </p>
        </header>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Generate New Exercises</CardTitle>
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
                        <Input id="topic" placeholder="e.g., Photosynthesis, Algebra, Shakespeare" {...field} />
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
                      <ShadFormLabel htmlFor="numQuestions">Number of Questions (1-10)</ShadFormLabel>
                      <FormControl>
                        <Input id="numQuestions" type="number" min="1" max="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Exercises'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {isLoading && exercises.length === 0 && (
           <div className="space-y-4">
            {[...Array(form.getValues("numQuestions") || 3)].map((_, i) => (
              <Card key={i} className="shadow-lg w-full animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {exercises.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center font-headline">
              Your Exercises on &quot;{form.getValues("topic")}&quot;
            </h2>
            <div className="space-y-4">
              {exercises.map((ex, index) => (
                <ExerciseCard key={ex.id} exercise={ex} index={index} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && exercises.length === 0 && form.formState.isSubmitted && (
          <Card className="text-center p-8 bg-secondary">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl font-headline mb-2">No Exercises Yet</CardTitle>
            <CardDescription>
              Enter a topic above and click &quot;Generate Exercises&quot; to get started.
              If you tried and nothing appeared, the AI might not have been able to generate questions for that specific topic. Try being more general or specific.
            </CardDescription>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
