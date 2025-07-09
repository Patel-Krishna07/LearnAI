
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareText, PenSquare, BookMarked, Feather, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  const features = [
    {
      icon: MessageSquareText,
      title: 'Multimodal Chat',
      description: 'Ask questions via text, voice, or image and get instant, insightful answers.',
      color: 'text-accent',
    },
    {
      icon: PenSquare,
      title: 'Practice Exercises',
      description: 'Test your knowledge with AI-generated quizzes and exercises tailored to your learning.',
      color: 'text-primary',
    },
    {
      icon: BookMarked,
      title: 'Personalized Study Guides',
      description: 'Save important Q&As and AI summaries to create your custom study materials.',
      color: 'text-green-500' // Example of a different color for variety
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary">
          <div className="container mx-auto px-6 text-center">
            <Feather className="h-20 w-20 text-accent mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6">
              Welcome to <span className="text-primary">{APP_NAME}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Your AI-Powered Interactive Learning Assistant. Ask, learn, and grow with intelligent support tailored for you.
            </p>
            {!loading && (
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Link href={isAuthenticated ? "/chat" : "/login"}>
                  Get Started <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-6 font-headline">Discover Your Learning Superpowers</h2>
            <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              LearnAI offers a suite of tools to make your study sessions more effective and engaging.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-t-4 border-accent">
                  <CardHeader className="items-center text-center">
                    <div className="p-4 bg-accent/10 rounded-full mb-4">
                      <feature.icon className={`h-12 w-12 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-2xl font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-md text-muted-foreground">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6 font-headline">Ready to Elevate Your Learning?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              Join LearnAI today and experience the future of education.
            </p>
            {!loading && (
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-200">
                 <Link href={isAuthenticated ? "/chat" : "/register"}>
                  {isAuthenticated ? "Go to Chat" : "Sign Up Now"}
                </Link>
              </Button>
            )}
          </div>
        </section>
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        Fueling curiosity, one question at a time.
      </footer>
    </div>
  );
}
