
'use server';

/**
 * @fileOverview The "listener" AI agent for the main chat interface.
 * It processes user's daily logs from text, voice, or files,
 * segregates skills/experiences, and updates the user's profile.
 * Enhanced with vector database integration for progress tracking.
 *
 * - processUserLog - The main function for the listener flow.
 * - ListenerInput - The input type for the listener flow.
 * - ListenerOutput - The return type for the listener flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {uploadToGoogleDrive} from '@/ai/tools/google-drive';
import {searchVectorDB, updateVectorDB} from '@/ai/tools/qdrant-vector-db';

const MAX_CHARS = 16000;

function truncateText(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
}


const VectorContextSchema = z.object({
  similarConversations: z.any().array(),
  speechPattern: z.any(),
  userSkills: z.any().array(),
});


const ListenerInputSchema = z.object({
  text: z.string().optional().describe('Text from the user.'),
  fileDataUri: z
    .string()
    .optional()
    .describe(
      "A file (like a certificate or image) from the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
   fileName: z.string().optional().describe("The name of the uploaded file."),
   existingProfile: z.string().describe('The user existing profile information in JSON format.'),
   userId: z.string().describe('The unique identifier for the user.'),
   vectorContext: VectorContextSchema.optional().describe("Optional vector enhancement data including similar conversations, speech patterns, and user skills."),
});
export type ListenerInput = z.infer<typeof ListenerInputSchema>;

const MilestoneSchema = z.object({
    date: z.string().describe("The date of the milestone in YYYY-MM-DD format."),
    description: z.string().describe("A brief description of the milestone or progress made."),
    progress_percentage: z.number().nullable().optional().describe("Optional percentage completion (0-100)."),
});

const ProgressItemSchema = z.object({
    item: z.string().describe("The name of the skill, project, or experience."),
    type: z.enum(["skill", "project", "work_experience", "education", "leadership"]).describe("The category of the item."),
    status: z.enum(["in-progress", "completed"]).describe("The current status of the item."),
    milestones: z.array(MilestoneSchema).describe("List of progress milestones for this item."),
    current_description: z.string().describe("Current state or focus of the item."),
    estimated_completion: z.string().optional().nullable().describe("Estimated completion date if applicable."),
    skills_used: z.array(z.string()).optional().describe("A list of skills used or developed in this item.")
});

const IdentifiedItemSchema = z.object({
    item: z.string().describe("The name of the skill, project, or experience."),
    type: z.enum(["skill", "project", "work_experience", "education", "leadership"]).describe("The category of the item."),
    status: z.enum(["in-progress", "completed"]).describe("The status of the item."),
    milestone: z.string().optional().describe("A brief description of the progress or completion milestone."),
    is_new: z.boolean().describe("Whether this is a newly identified item or an update to existing one."),
    progress_update: z.string().optional().describe("Description of progress made on existing item."),
});

const ListenerOutputSchema = z.object({
    responseMessage: z.string().describe('A friendly, conversational response to the user summarizing what was done.'),
    updatedProfileData: z.string().describe('The updated user profile information in JSON format. This should only include completed items.'),
    identifiedItems: z.array(IdentifiedItemSchema).describe("A list of all identified skills, projects, and experiences with their status."),
    progressUpdates: z.array(ProgressItemSchema).describe("Detailed progress tracking for in-progress items."),
    linkedinPostSuggestion: z.string().optional().nullable().describe("A suggested LinkedIn post draft for a significant completed milestone. Omit or set to null if no milestone was completed."),
    uploadConfirmation: z.string().optional().nullable().describe('A confirmation message if a file was uploaded to Google Drive. Omit or set to null if no file was uploaded.'),
    vectorDbUpdates: z.array(z.object({
        action: z.enum(["create", "update", "complete"]).describe("The type of vector DB operation."),
        item: z.string().describe("The item being updated."),
        embedding_text: z.string().describe("Text used for vector embedding."),
    })).describe("List of vector database operations performed."),
});
export type ListenerOutput = z.infer<typeof ListenerOutputSchema>;

export async function processUserLog(input: ListenerInput): Promise<ListenerOutput> {
    return listenerFlow(input);
}

const prompt = ai.definePrompt({
    name: 'listenerPrompt',
    input: {schema: ListenerInputSchema},
    output: {schema: ListenerOutputSchema},
    tools: [uploadToGoogleDrive, searchVectorDB, updateVectorDB],
    prompt: `You are a skilled Tech Professional and Career Intelligence Analyst with deep expertise in software development, project management, and career growth. You excel at identifying technical skills, project patterns, and professional development opportunities.

Your primary role is to analyze daily logs from tech professionals and extract valuable career intelligence while maintaining comprehensive progress tracking.

**Your Enhanced Capabilities:**

1.  **Technical Expertise**: You understand modern tech stacks, development methodologies (Agile, Scrum), certification paths (e.g., AWS, PMP), and industry trends. You can distinguish between skills (e.g., Python, Figma), projects (e.g., "AI Chatbot"), work experience (e.g., "Intern at Google"), education (e.g., "B.S. in CompSci"), and leadership (e.g., "Lead of GDSC").
2.  **Progress Analysis with Vector Database Integration**: You have tools to search and update a vector database that stores all 'in-progress' items for a user.

**Your Two Modes of Operation:**

1.  **LOGGING (Default Mode)**: When the user provides a daily log, new skill, or project update:
    *   **Search First**: Use the 'searchVectorDB' tool to find existing in-progress items related to the user's log.
    *   **Smart Matching & Categorization**: Identify if new mentions relate to existing tracked items. Correctly categorize each item as \`project\`, \`education\`, \`work_experience\`, or \`leadership\`. When analyzing projects or work experience, extract any mentioned skills and include them in the \`skills_used\` field for that item.
    *   **Milestone Tracking**: For in-progress items, track detailed milestones.
    *   **Update Vector DB**: Use 'updateVectorDB' to create new items or add milestones to existing ones.
    *   **Completion**: When an item is completed, update the user's JSON profile and use 'updateVectorDB' to mark the item as 'complete' (which removes it from in-progress tracking).
    *   **LinkedIn**: For significant completions, suggest a LinkedIn post.

2.  **QUERYING**: When the user asks a direct question about their progress (e.g., "what's my progress on X?", "how is project Y going?", "what am I working on?"):
    *   **Identify Intent**: Recognize that the user is asking a question, not providing a new log.
    *   **Search DB**: Use the 'searchVectorDB' tool with the user's query to find the relevant in-progress items.
    *   **Synthesize Answer**: Formulate a \`responseMessage\` that summarizes the status of ALL found items. For each item from the search result, state its name (e.g., 'Project X'), its category (e.g., 'Project'), and then list its stored milestones.
    *   **Empty Response**: For this mode, you MUST return empty arrays for \`identifiedItems\`, \`progressUpdates\`, and \`vectorDbUpdates\` as you are only querying, not updating.

**Context:**

*   **User ID**: {{{userId}}}
*   **Existing User Profile (JSON format)**:
    \`\`\`json
    {{{existingProfile}}}
    \`\`\`

*   **User's Daily Log / Query**:
    {{#if text}}
    Text: {{{text}}}
    {{/if}}
    {{#if fileDataUri}}
    File to process: A file named '{{fileName}}' has been uploaded. You MUST call the uploadToGoogleDrive tool and report on its success.
    {{/if}}

**Response Style:**
- Professional yet encouraging tone
- Tech-savvy language appropriate for the user's level
- Specific technical recognition and validation
- Forward-looking career guidance
- Celebration of both progress and completions

Remember: You are the user's intelligent career assistant. Accurately track their progress and provide clear answers when they ask for them.`,
});

const listenerFlow = ai.defineFlow(
  {
    name: 'listenerFlow',
    inputSchema: ListenerInputSchema,
    outputSchema: ListenerOutputSchema,
  },
  async (input) => {
    const trimmedVectorContext = {
      similarConversations: input.vectorContext?.similarConversations?.slice(0, 3) || [],
      speechPattern: input.vectorContext?.speechPattern || null,
      userSkills: input.vectorContext?.userSkills?.slice(0, 10) || [],
    };

    const trimmedInput = {
      ...input,
      text: input.text ? truncateText(input.text) : undefined,
      existingProfile: truncateText(input.existingProfile),
      vectorContext: trimmedVectorContext,
    };

    const { output } = await prompt(trimmedInput);
    return output!;
  }
);