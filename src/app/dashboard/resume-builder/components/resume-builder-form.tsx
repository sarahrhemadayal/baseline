
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateDocument } from '@/ai/flows/resume-builder';
import type { DocumentGeneratorOutput } from '@/ai/flows/resume-builder';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResumePreview } from './resume-preview';

const formSchema = z.object({
  jobDescription: z.string(),
});

type ResumeBuilderFormValues = z.infer<typeof formSchema>;

const profileToString = (profile: any) => {
    if (!profile) {
  return {
    basicInfo: '',
    education: '',
    workExperience: '',
    projects: '',
    skills: '',
    leadershipAndActivities: '',
    interests: '',
  };
}
    
    const basicInfo = `Name: ${profile.name}, Title: ${profile.title}, Email: ${profile.email}, Phone: ${profile.phone}, LinkedIn: ${profile.linkedin}, GitHub: ${profile.github}`;
    const education = profile.education?.map((e: any) => `${e.degree} from ${e.institution} (${e.period})`).join('. ');
    const workExperience = profile.work_experience?.map((w: any) => `${w.role} at ${w.company} (${w.period}): ${w.details.join(', ')}`).join('. ');
    const projects = profile.projects?.map((p: any) => `${p.name}: ${p.description} (Technologies: ${p.technologies.join(', ')})`).join('. ');
    const leadership = profile.leadership_and_activities?.map((l: any) => `${l.role} at ${l.organization} (${l.period}): ${l.details?.join(', ')}`).join('. ');
    const skills = profile.skills?.join(', ');
    const interests = profile.interests?.join(', ');

    return {
        basicInfo: basicInfo ?? '',
        education: education ?? '',
        workExperience: workExperience ?? '',
        projects: projects ?? '',
        skills: skills ?? '',
        leadershipAndActivities: leadership ?? '',
        interests: interests ?? '',
    };
}

interface ResumeBuilderFormProps {
    mode: 'cv' | 'tailored';
}

export default function ResumeBuilderForm({ mode }: ResumeBuilderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<DocumentGeneratorOutput | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  
  const resumeRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
    }
  }, []);
  
  const form = useForm<ResumeBuilderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: '',
    },
  });

  const onSubmit = async (values: ResumeBuilderFormValues) => {
    if (!userProfile) {
        toast({
            variant: 'destructive',
            title: 'Profile not found',
            description: 'Please complete onboarding first.',
        });
        return;
    }
     if (mode === 'tailored' && !values.jobDescription) {
      toast({
        variant: 'destructive',
        title: 'Job Description Required',
        description: 'Please provide a job description for a tailored resume.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateDocument({
        ...profileToString(userProfile),
        jobDescription: mode === 'tailored' ? values.jobDescription ?? '' : '',
      });

      setResult(output);
      toast({
        title: 'Successfully generated documents!',
        description: `Your ${mode === 'cv' ? 'CV' : 'resume and cover letter'} are ready for preview.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not generate documents. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadPdf = async (contentRef: React.RefObject<HTMLDivElement>, documentName: string) => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    try {
        const canvas = await html2canvas(contentRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let newCanvasWidth = pdfWidth;
        let newCanvasHeight = newCanvasWidth / ratio;
        
        // If the content is taller than the page, we need to handle multi-page
        if (newCanvasHeight > pdfHeight) {
             const pageCanvas = document.createElement('canvas');
             pageCanvas.width = canvasWidth;
             pageCanvas.height = (pdfHeight * canvasWidth) / pdfWidth;
             const pageContext = pageCanvas.getContext('2d');
             
             let position = 0;
             while(position < canvasHeight){
                if(position > 0) pdf.addPage();
                
                pageContext?.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
                pageContext?.drawImage(canvas, 0, position, canvasWidth, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);

                const pageImgData = pageCanvas.toDataURL('image/png');
                pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                position += pageCanvas.height;
             }
        } else {
            pdf.addImage(imgData, 'PNG', 0, 0, newCanvasWidth, newCanvasHeight, undefined, 'FAST');
        }

        pdf.save(`${documentName}.pdf`);
         toast({ title: `Downloaded ${documentName}.pdf` });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "An error occurred while creating the PDF.",
        });
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
         <CardHeader>
            <CardTitle className="font-headline">
                {mode === 'cv' ? 'Generate Your CV' : 'Job Description'}
            </CardTitle>
            <CardDescription>
                {mode === 'cv'
                ? 'Generate a comprehensive CV based on your stored profile.'
                : 'Your documents will be tailored to this description using your stored profile.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {mode === 'tailored' && (
                    <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea
                            placeholder="Paste the full job description here..."
                            className="min-h-[200px] resize-y"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                <Button type="submit" disabled={isLoading || !userProfile}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'cv' ? 'Generate CV' : 'Generate Documents'}
                </Button>
            </form>
            </Form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Generated {mode === 'cv' ? 'CV' : 'Resume'}</CardTitle>
                        <CardDescription>Preview of your document.</CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadPdf(resumeRef, mode === 'cv' ? 'CV' : 'Resume')}
                        disabled={isDownloading}
                    >
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </CardHeader>
                <CardContent>
                   <ResumePreview ref={resumeRef} content={result.document} />
                </CardContent>
            </Card>
            {mode === 'tailored' && result.coverLetter && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle className="font-headline">Generated Cover Letter</CardTitle>
                            <CardDescription>Preview of your cover letter.</CardDescription>
                        </div>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadPdf(coverLetterRef, 'CoverLetter')}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ResumePreview ref={coverLetterRef} content={result.coverLetter} />
                    </CardContent>
                </Card>
            )}
        </div>
      )}
    </div>
  );
}
