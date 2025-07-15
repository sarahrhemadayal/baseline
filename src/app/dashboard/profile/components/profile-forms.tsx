'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// --- Basic Info Form ---
const basicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  title: z.string().min(1, 'Title is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  linkedin: z.string().url('Invalid URL.').optional(),
  github: z.string().url('Invalid URL.').optional(),
});

export function BasicInfoForm({ data, onSave, onCancel }: { data: any, onSave: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="linkedin" render={({ field }) => (
          <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="github" render={({ field }) => (
          <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}


// --- Work Experience Form ---
const workExperienceSchema = z.object({
  role: z.string().min(1, 'Role is required.'),
  company: z.string().min(1, 'Company is required.'),
  period: z.string().min(1, 'Period is required.'),
  details: z.string().transform(val => val.split('\n').filter(Boolean)),
});

export function WorkExperienceForm({ data, onSave, onCancel }: { data: any, onSave: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: { ...data, details: data?.details?.join('\n') || '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="company" render={({ field }) => (
          <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="period" render={({ field }) => (
          <FormItem><FormLabel>Period (e.g., Jun 2022 - Present)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="details" render={({ field }) => (
          <FormItem><FormLabel>Details (one per line)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

// --- Education Form ---
const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required.'),
  degree: z.string().min(1, 'Degree is required.'),
  period: z.string().min(1, 'Period is required.'),
  details: z.string().optional(),
});

export function EducationForm({ data, onSave, onCancel }: { data: any, onSave: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: data,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="institution" render={({ field }) => (
          <FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="degree" render={({ field }) => (
          <FormItem><FormLabel>Degree/Certificate</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="period" render={({ field }) => (
          <FormItem><FormLabel>Period (e.g., 2018 - 2022)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="details" render={({ field }) => (
          <FormItem><FormLabel>Details (e.g., GPA, Honors)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}


// --- Project Form ---
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  technologies: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

export function ProjectForm({ data, onSave, onCancel }: { data: any, onSave: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { ...data, technologies: data?.technologies?.join(', ') || '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="technologies" render={({ field }) => (
          <FormItem><FormLabel>Technologies (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

// --- Leadership & Activity Form ---
const leadershipActivitySchema = z.object({
  role: z.string().min(1, 'Role is required.'),
  organization: z.string().min(1, 'Organization is required.'),
  period: z.string().min(1, 'Period is required.'),
  details: z.string().transform(val => val.split('\n').filter(Boolean)),
});

export function LeadershipActivityForm({ data, onSave, onCancel }: { data: any, onSave: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(leadershipActivitySchema),
    defaultValues: { ...data, details: data?.details?.join('\n') || '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem><FormLabel>Role/Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="organization" render={({ field }) => (
          <FormItem><FormLabel>Organization/Activity</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="period" render={({ field }) => (
          <FormItem><FormLabel>Period (e.g., Sep 2020 - May 2021)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="details" render={({ field }) => (
          <FormItem><FormLabel>Details (one per line)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}


// --- Skills Form ---
const skillsSchema = z.object({
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

export function SkillsForm({ data, onSave, onCancel }: { data: string[], onSave: (data: string[]) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(skillsSchema),
    defaultValues: { skills: data },
  });

  const onSubmit = (formData: { skills: string[] }) => {
    onSave(formData.skills);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="skills" render={({ field }) => (
          <FormItem><FormLabel>Skills (comma-separated)</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

// --- Interests Form ---
const interestsSchema = z.object({
  interests: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

export function InterestsForm({ data, onSave, onCancel }: { data: string[], onSave: (data: string[]) => void, onCancel: () => void }) {
  const form = useForm({
    resolver: zodResolver(interestsSchema),
    defaultValues: { interests: data },
  });

  const onSubmit = (formData: { interests: string[] }) => {
    onSave(formData.interests);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="interests" render={({ field }) => (
          <FormItem><FormLabel>Interests (comma-separated)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}
