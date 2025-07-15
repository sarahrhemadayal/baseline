'use client'

import Link from 'next/link';
import Image from 'next/image';
import Aurora from '../blocks/Backgrounds/Aurora/Aurora';
import {
  FileText,
  GitMerge,
  Linkedin,
  TrendingUp,
  Search,
  PlusCircle,
  ArrowRight,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
// import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton} from '@clerk/nextjs';


const features = [
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Resume & Cover Letter Generator',
    description:
      'Generates tailored resumes and cover letters by parsing job descriptions and leveraging your professional history.',
  },
  {
    icon: <GitMerge className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Skill Segregator',
    description:
      "Analyzes text, voice, and certificates to continuously update your profile, identifying new skills and experiences.",
  },
  {
    icon: <Linkedin className="h-8 w-8 text-primary" />,
    title: 'LinkedIn Post Generator',
    description:
      'Detects professional milestones and suggests post drafts to enhance your personal brand.',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: 'Skill Tracker',
    description:
      'Analyzes achievements and experiences to track skill progression and highlight primary interest areas.',
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'Interest Follow-Through',
    description:
      'Identifies skill gaps based on your interests and provides actionable, targeted advice for improvement.',
  },
  {
    icon: <PlusCircle className="h-8 w-8 text-primary" />,
    title: 'Effortless Activity Logging',
    description:
      'Log activities via text, voice notes, and uploads to keep your professional memory up-to-date.',
  },
];

const howItWorks = [
    {
        step: 1,
        title: "Log Your Progress",
        description: "Easily add new skills, projects, and experiences through text, voice, or by uploading documents."
    },
    {
        step: 2,
        title: "AI Analyzes & Organizes",
        description: "Our AI intelligently categorizes your entries, building a dynamic professional profile for you."
    },
    {
        step: 3,
        title: "Leverage Your History",
        description: "Generate tailored resumes, draft LinkedIn posts, and get skill-gap analysis with a single click."
    }
]

const testimonials = [
    {
        name: "Sarah J.",
        role: "Product Manager",
        avatar: "SJ",
        image: "https://placehold.co/100x100.png",
        dataAiHint: "woman portrait",
        quote: "Baseline has been a game-changer for my job search. The tailored resumes are incredible and saved me hours of work!"
    },
    {
        name: "Michael B.",
        role: "Software Engineer",
        avatar: "MB",
        image: "https://placehold.co/100x100.png",
        dataAiHint: "man professional",
        quote: "I used to forget to update my portfolio. Now, I just log my activities as they happen. It's brilliant for tracking my growth."
    },
    {
        name: "Linda K.",
        role: "UX Designer",
        avatar: "LK",
        image: "https://placehold.co/100x100.png",
        dataAiHint: "woman smiling",
        quote: "The LinkedIn post generator is my favorite feature. I'm building my personal brand more consistently than ever before."
    }
]

export default function Home() {
  return (
  
  <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden font-headline">
  <div className="fixed inset-0 -z-20 h-full w-full bg-background bg-[radial-gradient(circle_farthest-side_at_50%_100%,hsl(var(--primary)/0.1),transparent)]"></div>
  <div className="fixed inset-0 -z-30 h-full w-full bg-background bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px]"></div>

  {/* Aurora only behind navbar + hero */}
  <div className="relative overflow-hidden">
    <div className="absolute animate-fade-in duration-2000 opacity-0">
      <Aurora
        colorStops={["#2E1886", "#40245c", "#2E1886"]}
        blend={0.8}
        amplitude={2}
        speed={0.3}
      />
    </div>

    <header className="fixed px-4 lg:px-6 h-16 flex items-center top-0 left-0 w-full z-50 bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-b border-border/30 shadow-md font-headline">
      <Link href="/" className="flex items-center justify-center gap-2">
        <Logo className="h-6 w-6 text-primary" />
        <span className="text-xl font-semibold font-headline">Baseline</span>
      </Link>

      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Button asChild>
            <Link href="/dashboard">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
      </nav>
    </header>

    {/* Hero */}
    <section className="w-full min-h-screen flex items-center justify-center relative text-center">
  <div className="absolute -top-1/2 left-1/2 -z-10 h-[200%] w-[200%] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,hsl(var(--primary)/0.15)_0,transparent_50%)] animate-aurora" />

  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center space-y-6">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl/none font-headline animate-fade-in opacity-0">
        Build Your Career Narrative, <br />
        <span className="text-primary [text-shadow:0_0_24px_hsl(var(--primary)/0.8)]">Intelligently.</span>
      </h1>
      <p className="max-w-[600px] text-muted-foreground md:text-xl animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
        Baseline is your personal AI-driven career companion that helps you capture, organize, and leverage your professional growth.
      </p>
      <div className="flex flex-col gap-2 min-[400px]:flex-row animate-fade-in opacity-0" style={{ animationDelay: '400ms' }}>
        <Button asChild size="lg">
          <Link href="/onboarding">
            Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </div>
</section>
  </div>

        {/* How it works */}
<section id="how-it-works" className="w-full py-16 md:py-28 lg:py-36">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center text-center space-y-4">
      <span className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
        How It Works
      </span>
      <h2 className="text-3xl font-bold tracking-tight sm:text-5xl font-headline">
        Three Simple Steps to Success
      </h2>
      <p className="max-w-[800px] text-muted-foreground md:text-xl">
        Start capturing your career moments and let our AI do the heavy lifting.
      </p>
    </div>

    <div className="mx-auto max-w-3xl mt-16">
      {howItWorks.map((step, index) => (
        <div
          key={step.step}
          className={cn(
            "relative mb-16 flex flex-col md:flex-row items-center",
            index % 2 === 1 && "md:flex-row-reverse"
          )}
        >
          <div className="flex-shrink-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 font-headline text-lg">
            <span className="font-bold">{step.step}</span>
          </div>

          <div
            className={cn(
              "mt-6 md:mt-0 md:w-1/2 p-6",
              index % 2 === 1 ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"
            )}
          >
            <h3 className="text-xl font-bold font-headline">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


         {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                        Testimonials
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                        Loved by Professionals Worldwide
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            See what our users are saying about Baseline.
                        </p>
                    </div>
                 </div>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-1 md:gap-12 lg:grid-cols-3">
                     {testimonials.map((testimonial, i) => (
                         <Card key={testimonial.name} className="flex flex-col bg-card/80 backdrop-blur-sm border border-border/20 animate-fade-in opacity-0" style={{animationDelay: `${150 * i}ms`}}>
                            <CardContent className="pt-6">
                                <Quote className="w-8 h-8 text-primary/80 mb-4" />
                                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                            </CardContent>
                            <CardHeader className="flex-row gap-4 items-center mt-auto pt-4 border-t border-border/20">
                                <Avatar className="border-2 border-primary/50">
                                    <AvatarImage src={testimonial.image} data-ai-hint={testimonial.dataAiHint} />
                                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-base font-bold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </CardHeader>
                         </Card>
                     ))}
                 </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
             <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(circle_farthest-side_at_50%_0,hsl(var(--primary)/0.1),transparent)]"></div>
            <div className="container px-4 md:px-6 text-center flex flex-col items-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                    Ready to Take Control of Your Career?
                </h2>

                <p className="mx-auto max-w-[600px] text-muted-foreground mt-4 mb-8">
                   Stop letting your valuable experiences fade away. Start building your professional memory today.
                </p>
                 <Button asChild size="lg" className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow">
                    <Link href="/onboarding">
                      Sign Up for Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
            </div>
        </section>


      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/20 bg-background/80 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Baseline. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
