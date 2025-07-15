'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Database, MessageSquare, User, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { NextRequest, NextResponse } from 'next/server';


// Schemas
const EducationSchema = z.object({
  institution: z.string().describe('The name of the educational institution.'),
  degree: z.string().describe('The degree or certificate obtained.'),
  period: z.string().describe('The start and end dates of study (e.g., "2018 - 2022").'),
  details: z.string().optional().describe('Any additional details like GPA, honors, or relevant coursework.'),
});

const WorkExperienceSchema = z.object({
  company: z.string().describe('The name of the company.'),
  role: z.string().describe('The job title or role.'),
  period: z.string().describe('The start and end dates of employment (e.g., "Jun 2022 - Present").'),
  details: z.array(z.string()).describe('A list of responsibilities, achievements, or key tasks.'),
});

const ProjectSchema = z.object({
  name: z.string().describe('The name of the project.'),
  description: z.string().describe('A brief description of the project.'),
  technologies: z.array(z.string()).describe('A list of technologies, languages, or frameworks used.'),
});

const LeadershipActivitySchema = z.object({
  organization: z.string().describe('The name of the organization or activity.'),
  role: z.string().describe('Your role or title within the organization/activity.'),
  period: z.string().describe('The start and end dates of your involvement (e.g., "Sep 2020 - May 2021").'),
  details: z.array(z.string()).optional().describe('A list of responsibilities, achievements, or key tasks.'),
});

const ProfileSchema = z.object({
  name: z.string().optional().describe('The full name of the person. Infer this from the resume.'),
  title: z.string().optional().describe('The professional title, like "Software Engineer".'),
  email: z.string().optional().describe('The email address.'),
  phone: z.string().optional().describe('The phone number.'),
  linkedin: z.string().optional().describe('The URL of the LinkedIn profile.'),
  github: z.string().optional().describe('The URL of the GitHub profile.'),
  education: z.array(EducationSchema).describe('A list of educational experiences.'),
  work_experience: z.array(WorkExperienceSchema).describe('A list of work experiences.'),
  projects: z.array(ProjectSchema).describe('A list of projects.'),
  leadership_and_activities: z.array(LeadershipActivitySchema).optional().describe('A list of leadership roles and activities.'),
  skills: z.array(z.string()).describe('A list of professional and technical skills.'),
  interests: z.array(z.string()).optional().describe('A list of personal interests.'),
});

const SpeechPatternSchema = z.object({
  vocabulary_complexity: z.enum(['basic', 'intermediate', 'advanced']).describe('The complexity of vocabulary used'),
  sentence_length: z.enum(['short', 'medium', 'long']).describe('Average sentence length preference'),
  communication_style: z.enum(['formal', 'casual', 'technical', 'conversational']).describe('Overall communication style'),
  emotional_tone: z.enum(['positive', 'neutral', 'analytical', 'enthusiastic']).describe('Emotional tone in messages'),
  technical_depth: z.enum(['surface', 'moderate', 'deep']).describe('Level of technical detail provided'),
  common_phrases: z.array(z.string()).describe('Frequently used phrases or expressions'),
  preferred_topics: z.array(z.string()).describe('Topics the user frequently discusses'),
});

interface ProcessedChatData {
  userId: string;
  profileData: z.infer<typeof ProfileSchema>;
  speechPattern: z.infer<typeof SpeechPatternSchema>;
  rawMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  summary: string;
  extractedSkills: string[];
  keyInsights: string[];
}

interface ChatUploadProps {
  userId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
  onUploadComplete?: (success: boolean) => void;
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  console.log('Received:', data);
  return NextResponse.json({ message: 'Processed data here' });
}

export function ChatUpload({ userId, messages, onUploadComplete }: ChatUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedChatData | null>(null);
  const { toast } = useToast();

  const processMessages = async (messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>) => {
    setIsProcessing(true);
    setProgress(20);

    try {
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process messages');
      }

      const processed = await response.json();
      setProcessedData(processed);
      setProgress(60);
      
      toast({
        title: "Processing Complete",
        description: "Chat messages have been analyzed and processed.",
      });

      return processed;
    } catch (error) {
      console.error('Error processing messages:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description: 'Failed to process chat messages. Please try again.',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadToVectorDB = async (data: ProcessedChatData) => {
    setIsUploading(true);
    setProgress(80);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to upload to vector database');
      }

      const result = await response.json();
      setProgress(100);
      
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${result.vectorsCreated} vectors to the database.`,
      });

      onUploadComplete?.(true);
      return result;
    } catch (error) {
      console.error('Error uploading to vector DB:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Failed to upload to vector database. Please try again.',
      });
      onUploadComplete?.(false);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (messages.length === 0) {
      toast({
        title: "No Messages",
        description: "No chat messages to upload.",
      });
      return;
    }

    try {
      setProgress(0);
      const processed = await processMessages(messages);
      await uploadToVectorDB(processed);
      setProgress(0);
    } catch (error) {
      setProgress(0);
      console.error('Upload process failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Chat Data Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Messages to process:</span>
          </div>
          <Badge variant="secondary">{messages.length}</Badge>
        </div>

        {(isProcessing || isUploading) && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {isProcessing && "Processing chat messages..."}
              {isUploading && "Uploading to vector database..."}
            </p>
          </div>
        )}

        {processedData && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analysis Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Speech Pattern</h4>
                <div className="space-y-1">
                  <p><strong>Style:</strong> {processedData.speechPattern.communication_style}</p>
                  <p><strong>Complexity:</strong> {processedData.speechPattern.vocabulary_complexity}</p>
                  <p><strong>Tone:</strong> {processedData.speechPattern.emotional_tone}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Extracted Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {processedData.extractedSkills.slice(0, 5).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {processedData.extractedSkills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{processedData.extractedSkills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Key Insights</h4>
              <ul className="text-sm space-y-1">
                {processedData.keyInsights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload}
          disabled={isProcessing || isUploading || messages.length === 0}
          className="w-full"
        >
          {isProcessing || isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isProcessing ? "Processing..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Chat Data
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Chat messages will be analyzed for speech patterns and skills</p>
          <p>• Data will be securely stored in the vector database</p>
          <p>• This helps improve personalized responses and recommendations</p>
        </div>
      </CardContent>
    </Card>
  );
}