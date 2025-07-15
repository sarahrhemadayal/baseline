
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { processResume, OnboardingOutput } from '@/ai/flows/onboarding-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ArrowLeft, Upload, User, CheckCircle, BrainCircuit, Plus, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  WorkExperienceForm,
  EducationForm,
  ProjectForm,
  SkillsForm,
  LeadershipActivityForm,
  InterestsForm
} from '@/app/dashboard/profile/components/profile-forms';


type Step = 'name' | 'resume' | 'manual-forms' | 'parsing' | 'review' | 'avatar' | 'final-review' | 'done';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const Orb = ({className = ''}: {className?: string}) => (
    <div className={`relative w-40 h-40 mb-8 animate-gentle-float ${className}`}>
        <div className="absolute inset-0 rounded-full bg-primary opacity-50 blur-2xl"></div>
        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-primary via-accent to-secondary shadow-2xl">
            <BrainCircuit className="w-full h-full text-primary-foreground" />
        </div>
    </div>
);


export default function OnboardingPage() {
    const [step, setStep] = useState<Step>('name');
    const [previousStep, setPreviousStep] = useState<Step>('name');
    const [nickname, setNickname] = useState('');
    const [profile, setProfile] = useState<Partial<OnboardingOutput> & {avatar?: string}>({
        education: [],
        work_experience: [],
        projects: [],
        skills: [],
        interests: [],
        leadership_and_activities: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [resumeWasUploaded, setResumeWasUploaded] = useState(false);
    const [dialogType, setDialogType] = useState<string | null>(null);

    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const goBack = () => {
        switch (step) {
            case 'resume':
                setStep('name');
                break;
            case 'manual-forms':
                setStep('resume');
                break;
            case 'review':
                setStep(resumeWasUploaded ? 'resume' : 'manual-forms');
                break;
            case 'avatar':
                setStep('review');
                break;
            case 'final-review':
                setStep('avatar');
                break;
        }
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        if (name.trim()) {
            setNickname(name.trim());
            setProfile(p => ({ ...p, name: name.trim() }));
            setPreviousStep('name');
            setStep('resume');
        }
    };

    const handleResumeUpload = async (file: File) => {
        if (!file) return;
        setIsLoading(true);
        setStep('parsing');
        try {
            const resumeDataUri = await fileToDataUri(file);
            setResumeWasUploaded(true);
            const parsedData = await processResume({ resumeDataUri });
            
            setProfile(p => ({ ...p, ...parsedData, name: parsedData.name || p.name }));
            setPreviousStep('resume');
            setStep('review');

        } catch (error) {
            console.error('Failed to parse resume:', error);
            toast({
                variant: 'destructive',
                title: 'Parsing Failed',
                description: 'We couldn\'t process your resume. Please check the file or skip for now.',
            });
            setStep('review'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipResume = () => {
        setResumeWasUploaded(false);
        setPreviousStep('resume');
        setStep('manual-forms');
    };
    
    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPreviousStep('review');
        setStep('avatar');
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            fileToDataUri(file).then(avatarDataUri => {
                setProfile(p => ({...p, avatar: avatarDataUri}));
            });
        }
    };

    const finishOnboarding = async () => {
        setIsLoading(true);
        try {
            const finalProfile = {
                user_id: crypto.randomUUID(),
                name: profile.name || nickname,
                title: profile.title || '',
                avatar: profile.avatar || '',
                email: profile.email || '',
                phone: profile.phone || '',
                linkedin: profile.linkedin || '',
                github: profile.github || '',
                education: profile.education || [],
                work_experience: profile.work_experience || [],
                projects: profile.projects || [],
                leadership_and_activities: profile.leadership_and_activities || [],
                skills: profile.skills || [],
                interests: profile.interests || [],
            };

            localStorage.setItem('userProfile', JSON.stringify(finalProfile));
            setStep('done');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (error) {
             console.error('Error saving profile to localStorage:', error);
            toast({
                variant: 'destructive',
                title: 'Could not save profile',
                description: 'An error occurred while saving your profile. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (type: string, data: any) => {
        let newProfile;
        if (type === 'skills' || type === 'interests') {
            newProfile = { ...profile, [type]: data };
        } else {
            // @ts-ignore
            const items = profile[type] || [];
            newProfile = { ...profile, [type]: [...items, data] };
        }
        setProfile(newProfile);
        setDialogType(null);
    };

    const handleDelete = (type: string, itemToDelete: any) => {
        // @ts-ignore
        if (!profile[type]) return;
        // @ts-ignore
        const updatedItems = profile[type].filter((item: any) => item !== itemToDelete);
        const newProfile = { ...profile, [type]: updatedItems };
        setProfile(newProfile);
    };
    
    const renderDialogContent = () => {
        const currentData = {}; // Always adding new items in onboarding
        switch (dialogType) {
            case 'work_experience':
                return <WorkExperienceForm data={currentData} onSave={(data) => handleSave('work_experience', data)} onCancel={() => setDialogType(null)} />;
            case 'education':
                return <EducationForm data={currentData} onSave={(data) => handleSave('education', data)} onCancel={() => setDialogType(null)} />;
            case 'projects':
                return <ProjectForm data={currentData} onSave={(data) => handleSave('projects', data)} onCancel={() => setDialogType(null)} />;
            case 'leadership_and_activities':
                return <LeadershipActivityForm data={currentData} onSave={(data) => handleSave('leadership_and_activities', data)} onCancel={() => setDialogType(null)} />;
            case 'skills':
                return <SkillsForm data={profile.skills || []} onSave={(data) => handleSave('skills', data)} onCancel={() => setDialogType(null)} />;
            case 'interests':
                return <InterestsForm data={profile.interests || []} onSave={(data) => handleSave('interests', data)} onCancel={() => setDialogType(null)} />;
            default:
                return null;
        }
    };


    const ProfileReviewAccordion = ({ profile }: { profile: Partial<OnboardingOutput> }) => (
      <Accordion type="multiple" defaultValue={['basic_info', 'work_experience', 'education', 'skills', 'projects', 'leadership_and_activities', 'interests']} className="w-full">
          <AccordionItem value="basic_info">
              <AccordionTrigger className="font-headline">Basic Information</AccordionTrigger>
              <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{profile.name || 'Not provided'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium">Title</p>
                    <p className="text-sm text-muted-foreground">{profile.title || 'Not provided'}</p>
                </div>
                 <div className="space-y-1 col-span-full">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{profile.email || 'Not provided'}</p>
                </div>
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="work_experience">
              <AccordionTrigger className="font-headline">Work Experience</AccordionTrigger>
              <AccordionContent className="space-y-2">
                  {profile.work_experience && profile.work_experience.length > 0 ?
                    profile.work_experience.map((exp, i) => <p key={i} className="text-sm text-muted-foreground">{exp.role} at {exp.company}</p>)
                    : <p className="text-sm text-muted-foreground/80 italic">No work experience was found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="education">
              <AccordionTrigger className="font-headline">Education</AccordionTrigger>
              <AccordionContent className="space-y-2">
                  {profile.education && profile.education.length > 0 ?
                    profile.education.map((edu, i) => <p key={i} className="text-sm text-muted-foreground">{edu.degree} from {edu.institution}</p>)
                    : <p className="text-sm text-muted-foreground/80 italic">No education details were found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="projects">
              <AccordionTrigger className="font-headline">Projects</AccordionTrigger>
              <AccordionContent className="space-y-2">
                  {profile.projects && profile.projects.length > 0 ?
                    profile.projects.map((proj, i) => <p key={i} className="text-sm text-muted-foreground">{proj.name}</p>)
                    : <p className="text-sm text-muted-foreground/80 italic">No projects were found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
           <AccordionItem value="leadership_and_activities">
              <AccordionTrigger className="font-headline">Leadership & Activities</AccordionTrigger>
              <AccordionContent className="space-y-2">
                  {profile.leadership_and_activities && profile.leadership_and_activities.length > 0 ?
                    profile.leadership_and_activities.map((item, i) => <p key={i} className="text-sm text-muted-foreground">{item.role} at {item.organization}</p>)
                    : <p className="text-sm text-muted-foreground/80 italic">No leadership or activities were found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="skills">
              <AccordionTrigger className="font-headline">Skills</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2 pt-2">
                  {profile.skills && profile.skills.length > 0 ?
                    profile.skills.map((skill, i) => <Badge key={i} variant="secondary">{skill}</Badge>)
                    : <p className="text-sm text-muted-foreground/80 italic">No skills were found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="interests">
              <AccordionTrigger className="font-headline">Interests</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2 pt-2">
                  {profile.interests && profile.interests.length > 0 ?
                    profile.interests.map((interest, i) => <Badge key={i} variant="outline">{interest}</Badge>)
                    : <p className="text-sm text-muted-foreground/80 italic">No interests were found or provided.</p>
                  }
              </AccordionContent>
          </AccordionItem>
      </Accordion>
    );

    const renderStep = () => {
        switch (step) {
            case 'name':
                return (
                    <div className="flex flex-col items-center text-center max-w-lg w-full">
                        <Orb />
                        <h1 className="text-4xl font-headline font-bold">hi. welcome to baseline</h1>
                        <p className="text-muted-foreground mt-2 mb-8">Let's get your profile started. What can i call you?</p>
                        <form onSubmit={handleNameSubmit} className="w-full max-w-sm space-y-4">
                            <Input id="name" name="name" placeholder="your nickname" required className="text-center h-12 text-lg"/>
                            <Button type="submit" className="w-full h-12 text-lg">
                                Continue <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                );

            case 'resume':
                return (
                    <div className="flex flex-col items-center text-center max-w-lg w-full">
                         <Orb />
                         <h1 className="text-4xl font-headline font-bold">Upload Your Resume</h1>
                         <p className="text-muted-foreground mt-2 mb-8">Hi {nickname}! Let's speed things up. Upload your resume (PDF, DOCX) to auto-fill your profile.</p>
                         <div className="w-full max-w-sm space-y-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => e.target.files && handleResumeUpload(e.target.files[0])}
                            />
                            <Button onClick={() => fileInputRef.current?.click()} className="w-full h-12 text-lg">
                                <Upload className="mr-2 h-5 w-5" /> Upload Resume
                            </Button>
                            <Button variant="ghost" onClick={handleSkipResume} className="w-full h-12">
                                I'll fill it out manually
                            </Button>
                            <Button variant="link" onClick={goBack} className="w-full h-12 text-lg">
                                <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
                            </Button>
                        </div>
                    </div>
                );
            
            case 'manual-forms':
                return (
                   <div className="flex flex-col items-center text-center max-w-2xl w-full">
                       <Orb />
                       <h1 className="text-4xl font-headline font-bold">Build Your Profile</h1>
                       <p className="text-muted-foreground mt-2 mb-8">Let's add your details manually. You can add as much or as little as you want.</p>
                       <Card className="w-full bg-background/50 text-left">
                           <CardContent className="p-6">
                               <div className="space-y-4">
                                   <div className="space-y-2">
                                       <Label htmlFor="manual-name">Full Name</Label>
                                       <Input id="manual-name" value={profile.name || ''} onChange={(e) => setProfile(p => ({...p, name: e.target.value}))} placeholder="Your full name"/>
                                       <Label htmlFor="manual-title">Professional Title</Label>
                                       <Input id="manual-title" value={profile.title || ''} onChange={(e) => setProfile(p => ({...p, title: e.target.value}))} placeholder="e.g., Software Engineer"/>
                                       <Label htmlFor="manual-email">Email</Label>
                                       <Input id="manual-email" type="email" value={profile.email || ''} onChange={(e) => setProfile(p => ({...p, email: e.target.value}))} placeholder="Your email address"/>
                                   </div>
                                   <Accordion type="multiple" defaultValue={['work_experience']} className="w-full space-y-4">
                                       <AccordionItem value="work_experience" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Work Experience</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                               {profile.work_experience?.map((item, index) => (
                                                   <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                       <span>{item.role} at {item.company}</span>
                                                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('work_experience', item)}><Trash className="h-4 w-4" /></Button>
                                                   </div>
                                               ))}
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('work_experience')}><Plus className="mr-2 h-4 w-4"/> Add Work Experience</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                      <AccordionItem value="education" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Education</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                               {profile.education?.map((item, index) => (
                                                   <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                       <span>{item.degree} at {item.institution}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('education', item)}><Trash className="h-4 w-4" /></Button>
                                                   </div>
                                               ))}
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('education')}><Plus className="mr-2 h-4 w-4"/> Add Education</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                       <AccordionItem value="projects" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Projects</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                                {profile.projects?.map((item, index) => (
                                                   <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                       <span>{item.name}</span>
                                                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('projects', item)}><Trash className="h-4 w-4" /></Button>
                                                   </div>
                                               ))}
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('projects')}><Plus className="mr-2 h-4 w-4"/> Add Project</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                       <AccordionItem value="leadership_and_activities" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Leadership & Activities</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                                {profile.leadership_and_activities?.map((item, index) => (
                                                   <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                       <span>{item.role} at {item.organization}</span>
                                                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('leadership_and_activities', item)}><Trash className="h-4 w-4" /></Button>
                                                   </div>
                                               ))}
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('leadership_and_activities')}><Plus className="mr-2 h-4 w-4"/> Add Leadership/Activity</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                       <AccordionItem value="skills" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Skills</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                               <div className="flex flex-wrap gap-2 mb-2 min-h-[20px]">
                                                   {profile.skills?.map((skill, index) => <Badge key={index}>{skill}</Badge>)}
                                               </div>
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('skills')}><Edit className="mr-2 h-4 w-4"/> Edit Skills</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                        <AccordionItem value="interests" className="border-0">
                                           <AccordionTrigger className="p-0 hover:no-underline font-headline text-lg">Interests</AccordionTrigger>
                                           <AccordionContent className="pt-2 space-y-2">
                                               <div className="flex flex-wrap gap-2 mb-2 min-h-[20px]">
                                                   {profile.interests?.map((interest, index) => <Badge variant="outline" key={index}>{interest}</Badge>)}
                                               </div>
                                               <Button variant="outline" className="w-full" onClick={() => setDialogType('interests')}><Edit className="mr-2 h-4 w-4"/> Edit Interests</Button>
                                           </AccordionContent>
                                       </AccordionItem>
                                   </Accordion>
                               </div>
                               <div className="flex justify-between mt-8">
                                   <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                                   <Button onClick={() => { setPreviousStep('manual-forms'); setStep('review'); }} className="h-12 text-lg">Continue <ArrowRight className="ml-2 h-5 w-5"/></Button>
                               </div>
                           </CardContent>
                       </Card>
                        <Dialog open={!!dialogType} onOpenChange={(isOpen) => !isOpen && setDialogType(null)}>
                           <DialogContent>
                               <DialogHeader>
                                   <DialogTitle>Add {dialogType?.replace(/_/g, ' ')}</DialogTitle>
                               </DialogHeader>
                               {renderDialogContent()}
                           </DialogContent>
                       </Dialog>
                   </div>
               );

            case 'parsing':
                return (
                    <div className="flex flex-col items-center text-center max-w-lg w-full">
                        <Orb className="animate-pulse" />
                        <h1 className="text-4xl font-headline font-bold">AI at Work</h1>
                        <p className="text-muted-foreground mt-2">Our AI is analyzing your information... <br/>This might take a moment.</p>
                    </div>
                );

            case 'review':
                return (
                    <div className="flex flex-col items-center text-center max-w-2xl w-full">
                        <Orb />
                        <h1 className="text-4xl font-headline font-bold">Review Your Information</h1>
                        {resumeWasUploaded ? (
                            <p className="text-muted-foreground mt-2 mb-8">Our AI has extracted the following. Please review it before we continue.</p>
                        ) : (
                            <p className="text-muted-foreground mt-2 mb-8">Here's what you've added. You can make detailed edits from your profile page later.</p>
                        )}
                        <Card className="w-full bg-background/50 text-left">
                            <CardContent className="p-6">
                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                    <ProfileReviewAccordion profile={profile} />
                                    <p className="text-xs text-center text-muted-foreground pt-4">Don't worry if it's not perfect. You can edit everything from your profile page later.</p>
                                    <div className="flex justify-between">
                                        <Button variant="ghost" onClick={goBack} type="button"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                                        <Button type="submit" className="h-12 text-lg">Looks Good, Continue <ArrowRight className="ml-2 h-5 w-5" /></Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'avatar':
                return (
                     <div className="flex flex-col items-center text-center max-w-lg w-full">
                        <div className="relative w-40 h-40 mb-8 animate-gentle-float">
                            <div className="absolute inset-0 rounded-full bg-primary opacity-50 blur-2xl"></div>
                            <Avatar className="relative w-full h-full border-4 border-primary/50 shadow-2xl">
                                <AvatarImage src={profile.avatar as string} data-ai-hint="person professional" />
                                <AvatarFallback className="bg-transparent"><User className="h-20 w-20 text-primary-foreground/80" /></AvatarFallback>
                            </Avatar>
                        </div>
                        <h1 className="text-4xl font-headline font-bold">Add a Profile Picture</h1>
                        <p className="text-muted-foreground mt-2 mb-8">A great headshot adds a personal touch.</p>
                         <div className="w-full max-w-sm space-y-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full h-12 text-lg">
                                <Upload className="mr-2 h-5 w-5" /> {profile.avatar ? 'Change Picture' : 'Upload Picture'}
                            </Button>
                            <Button onClick={() => { setPreviousStep(step); setStep('final-review'); }} className="w-full h-12 text-lg">
                                Review and Finish
                            </Button>
                             <Button variant="link" onClick={goBack} className="w-full h-12 text-lg">
                                <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
                            </Button>
                        </div>
                    </div>
                );
            
            case 'final-review':
                return (
                    <div className="flex flex-col items-center text-center max-w-2xl w-full">
                        <div className="relative w-40 h-40 mb-8 animate-gentle-float">
                             <div className="absolute inset-0 rounded-full bg-primary opacity-50 blur-2xl"></div>
                            <Avatar className="relative w-full h-full border-4 border-primary/50 shadow-2xl">
                                <AvatarImage src={profile.avatar as string} data-ai-hint="person professional" />
                                <AvatarFallback className="bg-transparent"><User className="h-20 w-20 text-primary-foreground/80" /></AvatarFallback>
                            </Avatar>
                        </div>

                        <h1 className="text-4xl font-headline font-bold">One Last Look, {nickname}!</h1>
                        <p className="text-muted-foreground mt-2 mb-8">Here is your complete profile. Does everything look good?</p>
                        <Card className="w-full bg-background/50 text-left">
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    <ProfileReviewAccordion profile={profile} />
                                    <div className="flex justify-between">
                                        <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                                        <Button onClick={finishOnboarding} className="h-12 text-lg" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Complete Setup & Go to Dashboard'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'done':
                 return (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative w-40 h-40 mb-8">
                             <div className="absolute inset-0 rounded-full bg-green-500 opacity-50 blur-2xl"></div>
                             <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl">
                                <CheckCircle className="h-20 w-20 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-headline font-bold">All Set!</h1>
                        <p className="text-muted-foreground mt-2">Your Baseline profile is ready. Redirecting you to the dashboard...</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 dark overflow-hidden">
             <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"></div>
            {renderStep()}
        </div>
    );
}
