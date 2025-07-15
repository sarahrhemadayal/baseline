'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trackSkills } from '@/ai/flows/skill-tracker';
import { interestFollowThrough } from '@/ai/flows/interest-follow-through';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const skillTrackerSchema = z.object({
    achievements: z.string().min(10, 'Please describe your achievements.'),
    workExperience: z.string().min(10, 'Please describe your work experience.'),
});

const gapAnalysisSchema = z.object({
    careerGoals: z.string().min(10, 'Please describe your career goals.'),
});

type SkillTrackerValues = z.infer<typeof skillTrackerSchema>;
type GapAnalysisValues = z.infer<typeof gapAnalysisSchema>;

type SkillAnalysisProps = {
    feature: 'tracker' | 'gap-analysis';
};

const mockProfile = {
  userProfile: 'A software engineer with 2 years of experience in web development, specializing in React and Node.js. Holds a B.S. in Computer Science. Interested in machine learning and data science.',
  skillProgress: 'Advanced in JavaScript/React, Intermediate in Python, Beginner in TensorFlow.',
};


export function SkillAnalysis({ feature }: SkillAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const trackerForm = useForm<SkillTrackerValues>({
  resolver: zodResolver(skillTrackerSchema),
  defaultValues: { achievements: '', workExperience: '' },
});

const gapForm = useForm<GapAnalysisValues>({
  resolver: zodResolver(gapAnalysisSchema),
  defaultValues: { careerGoals: '' },
});

  const onSubmit = async (values: SkillTrackerValues | GapAnalysisValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      let output;
      if (feature === 'tracker') {
        output = await trackSkills(values as SkillTrackerValues);
      } else {
        output = await interestFollowThrough({
          ...mockProfile,
          ...(values as GapAnalysisValues)
        });
      }
      setResult(output);
      toast({ title: 'Analysis Complete!', description: 'Your results are ready below.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An Error Occurred', description: 'Could not perform analysis. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const skillLevelToValue = (level: string) => {
    switch (level.toLowerCase()) {
        case 'beginner': return 33;
        case 'intermediate': return 66;
        case 'advanced': return 100;
        default: return 10;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          {feature === 'tracker' ? 'Track Your Skills' : 'Analyze Skill Gaps'}
        </CardTitle>
        <CardDescription>
          {feature === 'tracker'
            ? 'Provide details about your achievements and experience to map your skills.'
            : 'Describe your career goals to identify gaps and get growth suggestions.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feature === 'tracker' ? (
  <Form {...trackerForm}>
    <form onSubmit={trackerForm.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={trackerForm.control}
        name="achievements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Achievements</FormLabel>
            <FormControl>
              <Textarea placeholder="List your key achievements, projects, awards..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={trackerForm.control}
        name="workExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Work Experience</FormLabel>
            <FormControl>
              <Textarea placeholder="Summarize your work experience..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze
      </Button>
    </form>
  </Form>
) : (
  <Form {...gapForm}>
    <form onSubmit={gapForm.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={gapForm.control}
        name="careerGoals"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Career Goals</FormLabel>
            <FormControl>
              <Textarea placeholder="What are your short-term and long-term career goals?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze
      </Button>
    </form>
  </Form>
)}

        {result && (
          <div className="mt-6 space-y-6">
            <Separator />
            {feature === 'tracker' ? (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-headline mb-2">Skill Progression</h3>
                        <div className="space-y-3">
                        {Object.entries(result.skillProgression).map(([skill, level]) => (
                            <div key={skill} className="grid gap-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">{skill}</span>
                                    <span className="text-sm text-muted-foreground">{level as string}</span>
                                </div>
                                <Progress value={skillLevelToValue(level as string)} />
                            </div>
                        ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-headline mb-2">Primary Interest Areas</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.primaryInterestAreas.map((area: string) => <Badge key={area} variant="secondary">{area}</Badge>)}
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-headline mb-2">Gap Analysis</h3>
                        <p className="text-sm text-muted-foreground">{result.gapAnalysis}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-headline mb-2">Suggested Improvements</h3>
                        <p className="text-sm text-muted-foreground">{result.suggestedImprovements}</p>
                    </div>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
