'use server';

/**
 * @fileOverview Skill Segregator AI agent.
 *
 * - segregateSkills - A function that handles the skill segregation process.
 * - SegregateSkillsInput - The input type for the segregateSkills function.
 * - SegregateSkillsOutput - The return type for the segregateSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SegregateSkillsInputSchema = z.object({
  textEntry: z.string().optional().describe('A text entry describing a new experience or skill.'),
  voiceNoteTranscription: z.string().optional().describe('A transcription of a voice note describing a new experience or skill.'),
  certificateDataUri: z
    .string()
    .optional()
    .describe(
      "A certificate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  existingProfile: z.string().describe('The user existing profile information in JSON format.'),
});
export type SegregateSkillsInput = z.infer<typeof SegregateSkillsInputSchema>;

const SegregateSkillsOutputSchema = z.object({
  updatedProfile: z.string().describe('The updated user profile information in JSON format.'),
  newSkills: z.array(z.string()).describe('The list of new skills identified from the input.'),
  newExperiences: z.array(z.string()).describe('The list of new experiences identified from the input.'),
});
export type SegregateSkillsOutput = z.infer<typeof SegregateSkillsOutputSchema>;

export async function segregateSkills(input: SegregateSkillsInput): Promise<SegregateSkillsOutput> {
  return segregateSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'segregateSkillsPrompt',
  input: {schema: SegregateSkillsInputSchema},
  output: {schema: SegregateSkillsOutputSchema},
  prompt: `You are an AI assistant that helps users to keep track of their professional skills and experiences.

You will receive various inputs such as text entries, voice note transcriptions, and certificates. Your task is to analyze these inputs, identify any new skills and experiences, and update the user's profile accordingly.

Here's the existing profile of the user:
{{{existingProfile}}}

Here's the new information to analyze:
{{#if textEntry}}
Text Entry: {{{textEntry}}}
{{/if}}
{{#if voiceNoteTranscription}}
Voice Note Transcription: {{{voiceNoteTranscription}}}
{{/if}}
{{#if certificateDataUri}}
Certificate: {{media url=certificateDataUri}}
{{/if}}

Based on the information above, please provide the updated user profile, a list of new skills, and a list of new experiences. The updated profile should be in JSON format.

Ensure that the profile includes all the information from the existing profile, plus any new information extracted from the inputs.`,
});

const segregateSkillsFlow = ai.defineFlow(
  {
    name: 'segregateSkillsFlow',
    inputSchema: SegregateSkillsInputSchema,
    outputSchema: SegregateSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
