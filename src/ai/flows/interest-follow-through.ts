'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying skill gaps based on tracked interests and suggesting actionable improvements.
 *
 * - interestFollowThrough - A function that processes user data to suggest skill improvements.
 * - InterestFollowThroughInput - The input type for the interestFollowThrough function.
 * - InterestFollowThroughOutput - The return type for the interestFollowThrough function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterestFollowThroughInputSchema = z.object({
  userProfile: z
    .string()
    .describe('A summary of the user profile, including skills, interests, and experiences.'),
  careerGoals: z.string().describe('The user provided career goals.'),
  skillProgress: z
    .string()
    .describe('A snapshot of the user skill progression in various sectors.'),
});
export type InterestFollowThroughInput = z.infer<typeof InterestFollowThroughInputSchema>;

const InterestFollowThroughOutputSchema = z.object({
  gapAnalysis: z.string().describe('An analysis of the gaps between the user skills and career goals.'),
  suggestedImprovements: z
    .string()
    .describe('Actionable suggestions for improving skills, without recommending specific courses.'),
});
export type InterestFollowThroughOutput = z.infer<typeof InterestFollowThroughOutputSchema>;

export async function interestFollowThrough(input: InterestFollowThroughInput): Promise<InterestFollowThroughOutput> {
  return interestFollowThroughFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interestFollowThroughPrompt',
  input: {schema: InterestFollowThroughInputSchema},
  output: {schema: InterestFollowThroughOutputSchema},
  prompt: `You are a career advisor that identifies gaps in skills based on tracked interests and suggests actionable improvements.

  Analyze the user's profile, career goals, and skill progression to identify gaps and suggest improvements.
  Do not recommend specific courses or lessons, provide general advice for directions to explore.

  User Profile: {{{userProfile}}}
  Career Goals: {{{careerGoals}}}
  Skill Progress: {{{skillProgress}}}

  Respond with gap analysis, and suggested improvements.
  `,
});

const interestFollowThroughFlow = ai.defineFlow(
  {
    name: 'interestFollowThroughFlow',
    inputSchema: InterestFollowThroughInputSchema,
    outputSchema: InterestFollowThroughOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
