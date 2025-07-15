
'use client';

import { useState } from 'react';
import { PageHeader } from '../components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Phone, Edit, Trash, Plus, Upload, User, Sparkles, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BasicInfoForm,
  WorkExperienceForm,
  EducationForm,
  ProjectForm,
  SkillsForm,
  LeadershipActivityForm,
  InterestsForm
} from './components/profile-forms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserProfile } from '@/lib/useUserProfile';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const { profile, loading, saveProfile } = useUserProfile();
    
    const [editingState, setEditingState] = useState<{type: string, index: number | null} | null>(null);

    const openDialog = (type: string, index: number | null = null) => {
        setEditingState({ type, index });
    };

    const closeDialog = () => {
        setEditingState(null);
    };

    const handleSave = async (data: any) => {
        if (!editingState || !profile) return;

        const { type, index } = editingState;
        const newProfile = JSON.parse(JSON.stringify(profile));

        if (type === 'basicInfo') {
            Object.assign(newProfile, data);
        } else if (type === 'skills' || type === 'interests') {
            newProfile[type] = data;
        } else {
            const section = newProfile[type] || [];
            if (index !== null) {
                section[index] = data;
            } else {
                section.push(data);
            }
            newProfile[type] = section;
        }

        await saveProfile(newProfile);
        closeDialog();
    };

    const handleDelete = async (type: string, index: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        if (!profile) return;

        const items = [...(profile as any)[type]];
        items.splice(index, 1);
        await saveProfile({ ...profile, [type]: items });
    };
    
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && profile) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                await saveProfile({ ...profile, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const renderDialogContent = () => {
        if (!editingState || !profile) return null;
        const { type, index } = editingState;
        const isNew = index === null;

        switch (type) {
            case 'basicInfo':
                return <BasicInfoForm data={profile} onSave={handleSave} onCancel={closeDialog} />;
            case 'work_experience':
                return <WorkExperienceForm data={isNew ? {} : profile.work_experience[index!]} onSave={handleSave} onCancel={closeDialog} />;
            case 'education':
                return <EducationForm data={isNew ? {} : profile.education[index!]} onSave={handleSave} onCancel={closeDialog} />;
            case 'projects':
                return <ProjectForm data={isNew ? {} : profile.projects[index!]} onSave={handleSave} onCancel={closeDialog} />;
            case 'leadership_and_activities':
                return <LeadershipActivityForm data={isNew ? {} : profile.leadership_and_activities[index!]} onSave={handleSave} onCancel={closeDialog} />;
            case 'skills':
                return <SkillsForm data={profile.skills || []} onSave={handleSave} onCancel={closeDialog} />;
            case 'interests':
                return <InterestsForm data={profile.interests || []} onSave={handleSave} onCancel={closeDialog} />;
            default:
                return null;
        }
    };

    const getDialogTitle = () => {
        if (!editingState) return '';
        const { type, index } = editingState;
        const isNew = index === null;
        const action = isNew ? 'Add ' : 'Edit ';
        
        switch (type) {
            case 'basicInfo': return 'Edit Basic Information';
            case 'skills': return 'Edit Skills';
            case 'interests': return 'Edit Interests';
            case 'work_experience': return `${action}Work Experience`;
            case 'education': return `${action}Education`;
            case 'projects': return `${action}Project`;
            case 'leadership_and_activities': return `${action}Leadership & Activity`;
            default: return '';
        }
    };
    
    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (!profile) {
        return <div>No profile found. Please complete onboarding.</div>
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Your Profile"
                description="Manage your personal details and professional history."
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Basic Information</CardTitle>
                        <CardDescription>Your personal and contact details.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openDialog('basicInfo')}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-start gap-8">
                     <div className="relative group">
                        <Avatar className="w-24 h-24 border">
                            <AvatarImage src={profile.avatar} alt={profile.name} data-ai-hint="person professional" />
                            <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                        </Avatar>
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                            <Upload className="h-6 w-6" />
                            <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm flex-grow">
                        <div className="space-y-1">
                            <p className="font-medium">Name</p>
                            <p className="text-muted-foreground">{profile.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Title</p>
                            <p className="text-muted-foreground">{profile.title}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Email Address</p>
                            <a href={`mailto:${profile.email}`} className="text-muted-foreground hover:text-primary hover:underline flex items-center gap-2 truncate">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{profile.email}</span>
                            </a>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Phone Number</p>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{profile.phone}</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">LinkedIn</p>
                            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline flex items-center gap-2 truncate">
                                <Linkedin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{profile.linkedin?.replace('https://www.', '')}</span>
                            </a>
                        </div>
                         <div className="space-y-1">
                            <p className="font-medium">GitHub</p>
                            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline flex items-center gap-2 truncate">
                                <Github className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{profile.github?.replace('https://', '')}</span>
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={['work_experience', 'education', 'projects', 'leadership_and_activities', 'skills', 'interests']} className="w-full space-y-4">
                {/* Work Experience */}
                <AccordionItem value="work_experience" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Work Experience</AccordionTrigger>
                         <Button variant="ghost" size="icon" onClick={() => openDialog('work_experience')}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4 space-y-4">
                        {profile.work_experience?.map((exp: any, index: number) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-lg">{exp.role}</CardTitle>
                                            <CardDescription>{exp.company} | {exp.period}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog('work_experience', index)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('work_experience', index)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {exp.details.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                 {/* Education */}
                <AccordionItem value="education" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Education</AccordionTrigger>
                       <Button variant="ghost" size="icon" onClick={() => openDialog('education')}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4 space-y-4">
                        {profile.education?.map((edu: any, index: number) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-lg">{edu.institution}</CardTitle>
                                            <CardDescription>{edu.degree} | {edu.period}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog('education', index)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('education', index)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {edu.details && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{edu.details}</p>
                                </CardContent>
                                )}
                            </Card>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                 {/* Projects */}
                <AccordionItem value="projects" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Projects</AccordionTrigger>
                        <Button variant="ghost" size="icon" onClick={() => openDialog('projects')}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4 space-y-4">
                        {profile.projects?.map((proj: any, index: number) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-lg">{proj.name}</CardTitle>
                                            <CardDescription>{proj.description}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog('projects', index)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('projects', index)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {proj.technologies.map((tech: string) => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                                </CardContent>
                            </Card>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                 {/* Leadership & Activities */}
                <AccordionItem value="leadership_and_activities" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Leadership & Activities</AccordionTrigger>
                        <Button variant="ghost" size="icon" onClick={() => openDialog('leadership_and_activities')}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4 space-y-4">
                        {profile.leadership_and_activities?.map((item: any, index: number) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="font-headline text-lg">{item.role}</CardTitle>
                                            <CardDescription>{item.organization} | {item.period}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog('leadership_and_activities', index)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('leadership_and_activities', index)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {item.details && item.details.length > 0 && (
                                <CardContent>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {item.details.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                    </ul>
                                </CardContent>
                                )}
                            </Card>
                        ))}
                    </AccordionContent>
                </AccordionItem>
                
                 {/* Skills */}
                <AccordionItem value="skills" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Skills</AccordionTrigger>
                        <Button variant="ghost" size="icon" onClick={() => openDialog('skills')}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4">
                        <Card>
                            <CardContent className="pt-6 flex flex-wrap gap-2">
                                {profile.skills?.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                {/* Interests */}
                <AccordionItem value="interests" className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline font-headline text-xl">Interests</AccordionTrigger>
                        <Button variant="ghost" size="icon" onClick={() => openDialog('interests')}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                    <AccordionContent className="px-0 pt-4">
                        <Card>
                            <CardContent className="pt-6 flex flex-wrap gap-2">
                                {profile.interests?.map((interest: string) => <Badge key={interest} variant="outline">{interest}</Badge>)}
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                    </DialogHeader>
                    {renderDialogContent()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
