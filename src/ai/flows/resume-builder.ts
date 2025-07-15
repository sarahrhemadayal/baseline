
// src/ai/flows/resume-builder.ts
'use server';
/**
 * @fileOverview A resume and cover letter generation AI agent.
 *
 * - generateDocument - A function that handles the resume and cover letter generation process.
 * - DocumentGeneratorInput - The input type for the generateDocument function.
 * - DocumentGeneratorOutput - The return type for the generateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs';
import path from 'path';

const DocumentGeneratorInputSchema = z.object({
  jobDescription: z.string().optional().describe('The job description for which the resume and cover letter are being generated. If not provided, a general CV will be created.'),
  basicInfo: z.string().describe('The user basic information like name, email, phone, etc.'),
  education: z.string().describe('The user education history.'),
  workExperience: z.string().describe('The user work experience history.'),
  projects: z.string().describe('The user projects history.'),
  skills: z.string().describe('The user skills.'),
  leadershipAndActivities: z.string().optional().describe('The user leadership and activities history.'),
  interests: z.string().optional().describe('The user interests.'),
  resumeTemplate: z.string().describe('The Markdown template for the resume/CV.'),
});
export type DocumentGeneratorInput = z.infer<typeof DocumentGeneratorInputSchema>;

const DocumentGeneratorOutputSchema = z.object({
  document: z.string().describe('The tailored resume or general CV generated, in Markdown format.'),
  coverLetter: z.string().optional().describe('The tailored cover letter generated for the job description, in Markdown format, if applicable.'),
});
export type DocumentGeneratorOutput = z.infer<typeof DocumentGeneratorOutputSchema>;

export async function generateDocument(input: Omit<DocumentGeneratorInput, 'resumeTemplate'>): Promise<DocumentGeneratorOutput> {
  const templatePath = path.join(process.cwd(), 'src', 'resume-template', 'resume.md');
  const resumeTemplate = fs.readFileSync(templatePath, 'utf-8');

  return generateDocumentFlow({ ...input, resumeTemplate });
}

const prompt = ai.definePrompt({
  name: 'documentGeneratorPrompt',
  input: {schema: DocumentGeneratorInputSchema},
  output: {schema: DocumentGeneratorOutputSchema},
  prompt: `You are an expert resume and cover letter writer. Your output MUST be in Markdown format and strictly follow the provided template.

You will use the user's professional history to generate a document.

**Formatting Rules:**
- **Omit Missing Information**: If a piece of information (like a date, GPA, or an entire section like 'Interests' or a contact detail) is not provided or is marked as 'N/A', completely omit that line or section from the final document. Do NOT write "N/A".
- **Contact Details**: For the contact line (PHONE | EMAIL | LINKEDIN), only include the details that are provided. Use a " | " separator between them. For example, if only email and LinkedIn are available, the output should be "EMAIL_ADDRESS | LINKEDIN_URL".
- **About Me Section**: Create a compelling "About Me" section as a paragraph, not a list.
- **Skills Section**: Group skills into relevant categories (e.g., Tech, Design, Languages) and present them as a bulleted list under each category heading.
- **Dates**: For all experiences (work, projects, etc.), if a date or period is available, place it in italics on the same line as the title, right-aligned if possible within Markdown constraints.

User's Professional History:
Basic Info: {{{basicInfo}}}
Education: {{{education}}}
Work Experience: {{{workExperience}}}
Projects: {{{projects}}}
Skills: {{{skills}}}
{{#if leadershipAndActivities}}
Leadership and Activities: {{{leadershipAndActivities}}}
{{/if}}
{{#if interests}}
Interests: {{{interests}}}
{{/if}}

Resume/CV Template:
---
{{{resumeTemplate}}}
---

Based on the template and rules above, fill in the user's information.

{{#if jobDescription}}
Job Description: {{{jobDescription}}}

Task: Generate a resume AND a cover letter tailored specifically to the job description provided. Both must be in Markdown format.
- The resume should highlight the most relevant skills and experiences for the role, using the template as a guide.
- The cover letter should be professional, engaging, and directly address the requirements in the job description.
Respond with both the 'document' (the resume) and 'coverLetter' fields.
{{else}}
Task: Generate a comprehensive, professional Curriculum Vitae (CV) in Markdown format, strictly following the provided template and formatting rules.
- This should be a general-purpose CV that is not tailored to any specific job.
- It should present the user's entire professional history in a clear, well-structured format as defined by the template.
- If information for a section is missing, omit the entire section. For example, if there are no internships, do not include the "### Internships" heading.
Respond with only the 'document' field (the CV). The 'coverLetter' field should be omitted.
{{/if}}
`,
});

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: DocumentGeneratorInputSchema,
    outputSchema: DocumentGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
