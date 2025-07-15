'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { processUserLog } from '@/ai/flows/listener';
import type { ListenerOutput } from '@/ai/flows/listener';
import { useUserProfile } from '@/lib/useUserProfile';
import { useRouter } from 'next/navigation';
import { ChatUpload } from './chat-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Paperclip, Send, User, Bot, Sparkles, BrainCircuit, Linkedin, FileText, TrendingUp, Briefcase, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';

const formSchema = z.object({
  text: z.string().optional(),
  file: z.any().optional(),
});

type ChatFormValues = z.infer<typeof formSchema>;

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: React.ReactNode;
}

interface VectorData {
  similarConversations: any[];
  speechPattern: any;
  userSkills: any[];
}

export function ChatInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { profile, loading, saveProfile } = useUserProfile();
  const router = useRouter();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: '' },
  });

  const handleUploadComplete = (success: boolean) => {
    setShowUploadDialog(false);
    if (success) {
      toast({
        title: "Upload Complete",
        description: "Your chat data has been successfully uploaded to the vector database.",
      });
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      // Simulate stopping recording and transcribing
      const simulatedTranscription = "I finished the new feature for the AI chatbot project today and also got my 'Advanced TypeScript' certificate.";
      const currentText = form.getValues('text');
      form.setValue('text', currentText ? `${currentText} ${simulatedTranscription}`: simulatedTranscription);
      toast({
        title: "Voice Note Added",
        description: "Simulated voice transcription has been added to your message.",
      });
    } else {
        toast({
            title: "Recording Started",
            description: "Click again to stop. (This is a simulation)",
        });
    }
    setIsRecording(!isRecording);
  };

  // Enhanced function to get vector data for context
  const enhanceResponseWithVectorData = async (userMessage: string, userId: string): Promise<VectorData | null> => {
    try {
      // Search for similar past conversations
      const searchResponse = await fetch('srf/api/chat/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: userMessage,
          userId,
          limit: 5,
        }),
      });
      const searchData = await searchResponse.json();

      // Get user's speech pattern
      const speechPatternResponse = await fetch(`/api/chat/search?userId=${userId}&action=speech_pattern`);
      const speechPatternData = await speechPatternResponse.json();

      // Get user's skills
      const skillsResponse = await fetch(`/api/chat/search?userId=${userId}&action=skills`);
      const skillsData = await skillsResponse.json();

      return {
        similarConversations: searchData.results || [],
        speechPattern: speechPatternData.data || {},
        userSkills: skillsData.data || [],
      };
    } catch (error) {
      console.error('Error enhancing response:', error);
      return null;
    }
  };

  const onSubmit = async (values: ChatFormValues) => {
    const { text, file } = values;
    if (!text && !file?.[0]) return;
    if (loading || !profile) {
        toast({ title: "Profile not loaded", description: "Please wait for your profile to load before chatting."});
        return;
    }

    setIsLoading(true);
    
    // Add user message to UI
    const userMessageId = `user-${Date.now()}`;
    const userMessageContent = (
        <div className="space-y-2">
            {text && <p>{text}</p>}
            {file?.[0] && <Badge variant="secondary">{file[0].name}</Badge>}
        </div>
    );
    setMessages(prev => [...prev, { id: userMessageId, role: 'user', content: userMessageContent }]);

    // Add thinking message
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: <Loader2 className="h-5 w-5 animate-spin" /> }]);

    form.reset();
    if(fileInputRef.current) fileInputRef.current.value = "";

    try {
      let fileDataUri: string | undefined;
      if (file && file.length > 0) {
        fileDataUri = await fileToDataUri(file[0]);
      }

      // Enhance with vector data
      const vectorData = await enhanceResponseWithVectorData(text || '', profile.user_id);

      // Process user log with enhanced context
      const output = await processUserLog({
        userId: profile.user_id,
        existingProfile: JSON.stringify(profile),
        text,
        fileDataUri,
        fileName: file?.[0]?.name,
        vectorContext: vectorData ?? undefined, // Add vector context
      });

      console.log('Chat output:', JSON.stringify(output, null, 2));

      // Update assistant's "thinking" message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: <AssistantResponse response={output} /> } 
          : msg
      ));
      
      // Update profile state silently
      if (output.updatedProfileData) {
        await saveProfile(JSON.parse(output.updatedProfileData));
      }

    } catch (error) {
      console.error(error);
      const errorContent = "Sorry, I encountered an error. Please try that again."
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: errorContent } 
          : msg
      ));
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not process your message. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-grow p-4">
            <div className="space-y-6">
                {messages.map(message => (
                    <div key={message.id} className={cn("flex items-start gap-4", message.role === 'user' && 'justify-end')}>
                        {message.role === 'assistant' && (
                            <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    <BrainCircuit className="h-5 w-5"/>
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "max-w-[85%] rounded-2xl p-4 text-sm shadow-md", 
                            message.role === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                : 'bg-card text-card-foreground rounded-bl-none'
                        )}>
                            {message.content}
                        </div>
                        {message.role === 'user' && (
                             <Avatar className="h-9 w-9 border">
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            <Card>
                <CardContent className="p-2">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                             <FormField
                                control={form.control}
                                name="file"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    ref={input => {
                                                        field.ref(input);
                                                        fileInputRef.current = input;
                                                    }}
                                                    onChange={(e) => {
                                                        const files = e.target.files;
                                                        field.onChange(files);
                                                        if (files && files[0]) {
                                                            toast({ title: "File selected", description: files[0].name });
                                                        }
                                                    }}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                                                    <Paperclip className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder="Tell me about your day..." {...field} autoComplete="off" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Upload Chat Data
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Upload Chat Data to Vector Database</DialogTitle>
                                    </DialogHeader>
                                    <ChatUpload
                                        userId={profile?.user_id || ''}
                                        messages={messages.map(msg => ({
                                            id: msg.id,
                                            role: msg.role,
                                            content: typeof msg.content === 'string' ? msg.content : '',
                                        }))}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </DialogContent>
                            </Dialog>
                             <Button type="button" variant="ghost" size="icon" onClick={handleVoiceRecording} className={cn(isRecording && 'text-red-500')}>
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button type="submit" size="icon" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

function AssistantResponse({ response }: { response: ListenerOutput }) {
    const { responseMessage, identifiedItems, linkedinPostSuggestion, uploadConfirmation } = response;
    
    const completedItems = identifiedItems.filter(item => item.status === 'completed');
    const inProgressItems = identifiedItems.filter(item => item.status === 'in-progress');

    const iconMap = {
        skill: <TrendingUp className="h-4 w-4" />,
        project: <FileText className="h-4 w-4" />,
        work_experience: <Briefcase className="h-4 w-4" />,
        education: <GraduationCap className="h-4 w-4" />,
        leadership: <User className="h-4 w-4" />,
    }

    return (
        <div className="space-y-4">
            <p className="whitespace-pre-wrap">{responseMessage}</p>

            {(identifiedItems.length > 0 || uploadConfirmation) && (
                 <Card className="bg-background/50">
                    <CardHeader>
                        <CardTitle className="text-base font-headline flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary"/>
                            Analysis Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                         {uploadConfirmation && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Paperclip className="h-4 w-4 flex-shrink-0" />
                                <p>{uploadConfirmation}</p>
                            </div>
                        )}
                       {completedItems.length > 0 && (
                           <div>
                                <h4 className="font-semibold mb-2">Completed & Added to Profile:</h4>
                               <ul className="space-y-1.5">
                                   {completedItems.map((item, i) => (
                                       <li key={`comp-${i}`} className="flex items-start gap-2">
                                           <span className="text-primary mt-0.5">{iconMap[item.type]}</span>
                                           <span><strong>{item.item}</strong>{item.milestone && `: ${item.milestone}`}</span>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}
                       {inProgressItems.length > 0 && (
                           <div>
                                <h4 className="font-semibold mb-2">In-Progress Items:</h4>
                                <ul className="space-y-1.5">
                                   {inProgressItems.map((item, i) => (
                                       <li key={`prog-${i}`} className="flex items-start gap-2">
                                           <span className="text-muted-foreground mt-0.5">{iconMap[item.type]}</span>
                                           <span><strong>{item.item}</strong>{item.milestone && `: ${item.milestone}`}</span>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}
                    </CardContent>
                </Card>
            )}

            {linkedinPostSuggestion && (
                 <Card className="bg-background/50 border-primary/50">
                    <CardHeader>
                        <CardTitle className="text-base font-headline flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-primary"/>
                            LinkedIn Post Suggestion
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="prose prose-sm dark:prose-invert max-w-full p-3 bg-background rounded-md border">
                            <ReactMarkdown>{linkedinPostSuggestion}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}