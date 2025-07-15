
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateLinkedInPost } from '@/ai/flows/linkedin-post-generator';
import type { GenerateLinkedInPostOutput } from '@/ai/flows/linkedin-post-generator';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Linkedin, Lightbulb } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  milestone: z
    .string()
    .min(10, 'Please describe your milestone in more detail.'),
  pastPosts: z.string().optional(),
  userAdvice: z.string().optional(),
});

type LinkedinFormValues = z.infer<typeof formSchema>;

interface LinkedinPostFormProps {
  selectedMilestone: string;
  onMilestoneChange: (milestone: string) => void;
}


export default function LinkedinPostForm({
  selectedMilestone,
  onMilestoneChange,
}: LinkedinPostFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateLinkedInPostOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<LinkedinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      milestone: '',
      pastPosts: '',
      userAdvice: '',
    },
  });

  useEffect(() => {
    if (selectedMilestone) {
      form.setValue('milestone', selectedMilestone, { shouldValidate: true });
    }
  }, [selectedMilestone, form]);

  const onSubmit = async (values: LinkedinFormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateLinkedInPost({
        milestone: values.milestone,
        pastPosts: values.pastPosts,
        userAdvice: values.userAdvice,
      });

      setResult(output);
      toast({
        title: 'Post Generated!',
        description: 'Your new LinkedIn post draft is ready.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not generate post. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const shareOnLinkedIn = (text: string) => {
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  
  const useAdvice = (advice: string) => {
    form.setValue('userAdvice', advice);
    toast({ title: 'Advice loaded!', description: "The AI's suggestion has been added to the strategic advice field for your next post." });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Post Details</CardTitle>
          <CardDescription>
            Select a milestone from the right or describe your own achievement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="milestone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Completed a new certification, launched a project..."
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onMilestoneChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pastPosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent Post Topics (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Topics of your recent posts to avoid redundancy..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide context to help the AI generate a more relevant post.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userAdvice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Strategic Advice (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Make the tone more casual', 'Focus on the challenges I overcame', 'Mention my goal to work in AI'"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Guide the AI's generation. You can use the advice generated by the AI below as a starting point.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Post
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline">Post Draft</CardTitle>
                <CardDescription>
                  A ready-to-use draft for your post.
                </CardDescription>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(result.postDraft)}
                    title="Copy to Clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => shareOnLinkedIn(result.postDraft)}
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={result?.postDraft ?? 'Your generated post will appear here.'}
              className="min-h-[200px] resize-y bg-secondary"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline">AI Posting Advice</CardTitle>
                <CardDescription>Tips to improve your branding.</CardDescription>
              </div>
               {result && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useAdvice(result.postingAdvice)}
                    title="Use this advice for the next post"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Use this advice
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {result?.postingAdvice ?? 'Personalized advice will appear here.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
