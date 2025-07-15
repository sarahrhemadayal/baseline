'use server';
/**
 * @fileOverview An AI agent for onboarding users by parsing their resumes.
 *
 * - processResume - Parses a resume file and extracts structured professional data.
 * - OnboardingInput - The input type for the processResume function.
 * - OnboardingOutput - The return type for the processResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Zod Schemas for structured data extraction
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
export type OnboardingOutput = z.infer<typeof ProfileSchema>;


const OnboardingInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;


export async function processResume(input: OnboardingInput): Promise<OnboardingOutput> {
  return onboardingFlow(input);
}


const prompt = ai.definePrompt({
  name: 'onboardingPrompt',
  input: {schema: OnboardingInputSchema},
  output: {schema: ProfileSchema},
  prompt: `You are an expert resume parsing AI. Your task is to analyze the provided resume and extract the user's professional history into a structured JSON format.

  Carefully parse the document provided in the 'resumeDataUri' field.
  Extract the user's name, professional title, contact information, education, work experience, projects, leadership roles/activities, skills, and interests.
  For work experience and leadership/activities, list responsibilities and achievements as an array of strings in the 'details' field.
  For projects, list technologies as an array of strings.
  If a piece of information is not available in the resume, omit the field from the output.

  Resume Document:
  {{media url=resumeDataUri}}

  Provide the output in the specified JSON schema.`,
});

const onboardingFlow = ai.defineFlow(
  {
    name: 'onboardingFlow',
    inputSchema: OnboardingInputSchema,
    outputSchema: ProfileSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
