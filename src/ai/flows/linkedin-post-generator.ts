
'use server';

/**
 * @fileOverview A LinkedIn post generator AI agent.
 *
 * - generateLinkedInPost - A function that handles the generation of LinkedIn posts.
 * - GenerateLinkedInPostInput - The input type for the generateLinkedInPost function.
 * - GenerateLinkedInPostOutput - The return type for the generateLinkedInPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLinkedInPostInputSchema = z.object({
  milestone: z
    .string()
    .describe('The professional milestone to generate a LinkedIn post for.'),
  pastPosts: z
    .string()
    .optional()
    .describe(
      'A summary of recent LinkedIn posts, if available, to avoid redundancy.'
    ),
  userAdvice: z
    .string()
    .optional()
    .describe('Specific strategic advice from the user to guide the tone, content, or style of the post and future advice.')
});
export type GenerateLinkedInPostInput = z.infer<typeof GenerateLinkedInPostInputSchema>;

const GenerateLinkedInPostOutputSchema = z.object({
  postDraft: z.string().describe('A draft for a LinkedIn post.'),
  postingAdvice: z
    .string()
    .describe(
      'Advice on posting frequency and content to achieve personal branding goals, taking into account user advice.'
    ),
});
export type GenerateLinkedInPostOutput = z.infer<typeof GenerateLinkedInPostOutputSchema>;

export async function generateLinkedInPost(
  input: GenerateLinkedInPostInput
): Promise<GenerateLinkedInPostOutput> {
  return generateLinkedInPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'linkedInPostTextPrompt',
  input: {schema: GenerateLinkedInPostInputSchema},
  output: {schema: z.object({
    postDraft: z.string(),
    postingAdvice: z.string()
  })},
  prompt: `You are a personal branding expert specializing in creating engaging LinkedIn content for professionals.

You will use the provided milestone to generate a LinkedIn post draft. You will also provide new posting advice.

**Instructions:**
- **Incorporate User Advice**: Carefully consider the 'userAdvice' provided. This is strategic feedback from the user. Your generated post and your new 'postingAdvice' should reflect and build upon these instructions.
- **Tone for Post Draft**: Professional, enthusiastic, and forward-looking.
- **Structure for Post Draft**: Start with a strong opening line. Use short paragraphs for readability. End with a call to engagement or a forward-looking statement.
- **Hashtags for Post Draft**: Include 3-5 relevant and popular hashtags (e.g., #AI, #CareerDevelopment, #Tech).
- **Emojis for Post Draft**: Use emojis sparingly and professionally to add personality (e.g., 🎉, 🚀, 💡).
- **New Posting Advice**: Generate fresh, actionable advice to help the user achieve their personal branding goals, taking into account the milestone and any user-provided advice.

Milestone: {{{milestone}}}
{{#if pastPosts}}
Past Posts: {{{pastPosts}}}
{{/if}}
{{#if userAdvice}}
User's Strategic Advice: {{{userAdvice}}}
{{/if}}

Here's an example of a good post:
"Thrilled to share that I've completed the AI Nanodegree program from Udacity! 🎉 This intensive program has equipped me with cutting-edge skills in machine learning, deep learning, and neural networks. I'm excited to apply these skills to solve real-world problems and contribute to the AI community. #AI #MachineLearning #DeepLearning #Udacity"

Here's an example of good posting advice:
"To build your brand, focus on sharing insights from your projects, commenting on industry news, and engaging with other professionals in your network."
`,
});


const generateLinkedInPostFlow = ai.defineFlow(
  {
    name: 'generateLinkedInPostFlow',
    inputSchema: GenerateLinkedInPostInputSchema,
    outputSchema: GenerateLinkedInPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
