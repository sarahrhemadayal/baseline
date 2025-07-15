'use server';

/**
 * @fileOverview Skill tracker AI agent.
 *
 * - trackSkills - A function that handles the skill tracking process.
 * - SkillTrackerInput - The input type for the trackSkills function.
 * - SkillTrackerOutput - The return type for the trackSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillTrackerInputSchema = z.object({
  achievements: z.string().describe('A detailed list of user achievements.'),
  workExperience: z.string().describe('A detailed description of work experience.'),
});
export type SkillTrackerInput = z.infer<typeof SkillTrackerInputSchema>;

const SkillTrackerOutputSchema = z.object({
  skillProgression: z.record(z.string(), z.string()).describe('A map of skills to their progression level (e.g., Beginner, Intermediate, Advanced).'),
  primaryInterestAreas: z.array(z.string()).describe('A list of the user’s primary areas of interest based on their skills and experience.'),
});
export type SkillTrackerOutput = z.infer<typeof SkillTrackerOutputSchema>;

export async function trackSkills(input: SkillTrackerInput): Promise<SkillTrackerOutput> {
  return trackSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'skillTrackerPrompt',
  input: {schema: SkillTrackerInputSchema},
  output: {schema: SkillTrackerOutputSchema},
  prompt: `You are an AI career coach specializing in skill tracking and interest area identification.

You will analyze the user's achievements and work experience to track their skill progression and identify their primary areas of interest.

Achievements: {{{achievements}}}
Work Experience: {{{workExperience}}}

Based on this information, provide a skill progression map and a list of primary interest areas.

{{zod schema=SkillTrackerOutputSchema}}`,
});

const trackSkillsFlow = ai.defineFlow(
  {
    name: 'trackSkillsFlow',
    inputSchema: SkillTrackerInputSchema,
    outputSchema: SkillTrackerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
