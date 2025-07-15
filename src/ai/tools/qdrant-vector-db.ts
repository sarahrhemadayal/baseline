
'use server';
/**
 * @fileOverview Genkit tools for interacting with a Qdrant vector database.
 * This file defines tools for searching and updating a Qdrant collection to
 * provide persistent memory for the AI assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_API_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'user_progress';

// Helper to create embeddings
async function createEmbedding(text: string) {
  const [{ embedding }] = await ai.embed({
    embedder: 'googleai/text-embedding-004',
    content: text,
  });
  return embedding;
}

// Ensure the collection exists
async function ensureCollection() {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(c => c.name === COLLECTION_NAME);
    if (!collectionExists) {
        await qdrantClient.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 768, // Matches the output of text-embedding-004
                distance: 'Cosine',
            },
        });
    }
}
ensureCollection();


export const searchVectorDB = ai.defineTool(
  {
    name: 'searchVectorDB',
    description: 'Searches for existing in-progress items related to the user\'s log or query in the vector database.',
    inputSchema: z.object({
        query: z.string().describe("The user's log or query to search for related items."),
        userId: z.string().describe("The unique identifier for the user."),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        payload: z.any(),
        score: z.number(),
    })),
  },
  async ({ query, userId }) => {
    const queryVector = await createEmbedding(query);
    
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
        vector: queryVector,
        filter: {
            must: [
                { key: 'userId', match: { value: userId } },
                { key: 'status', match: { value: 'in-progress' } },
            ],
        },
        limit: 5, // Return top 5 most similar items
        with_payload: true,
    });
    
    return searchResult.map(result => ({
        id: result.id.toString(),
        payload: result.payload,
        score: result.score,
    }));
  }
);


const MilestoneSchema = z.object({
    date: z.string().describe("The date of the milestone in YYYY-MM-DD format."),
    description: z.string().describe("A brief description of the milestone or progress made."),
    progress_percentage: z.number().nullable().optional().describe("Optional percentage completion (0-100)."),
});


export const updateVectorDB = ai.defineTool(
  {
    name: 'updateVectorDB',
    description: 'Updates or creates an in-progress item in the vector database. Can also mark items as complete.',
    inputSchema: z.object({
        userId: z.string().describe("The unique identifier for the user."),
        action: z.enum(["create", "update", "complete"]).describe("The operation to perform."),
        itemId: z.string().optional().describe("The unique ID of the item to update or complete. Required for 'update' and 'complete' actions."),
        itemData: z.object({
            item: z.string().describe("The name of the skill, project, or experience."),
            type: z.enum(["skill", "project", "work_experience", "education", "leadership"]).describe("The category of the item."),
            embedding_text: z.string().describe("A concise text description used for vector embedding."),
            milestones: z.array(MilestoneSchema).describe("A list of progress milestones."),
            skills_used: z.array(z.string()).optional().describe("A list of skills used or developed in this item.")
        }).optional().describe("The data for the item. Required for 'create' and 'update' actions."),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        id: z.string().optional(),
    }),
  },
  async ({ userId, action, itemId, itemData }) => {
    switch (action) {
      case 'create':
        if (!itemData) throw new Error("itemData is required for 'create' action.");
        const createVector = await createEmbedding(itemData.embedding_text);
        const pointId = crypto.randomUUID();
        await qdrantClient.upsert(COLLECTION_NAME, {
            wait: true,
            points: [{
                id: pointId,
                vector: createVector,
                payload: { ...itemData, userId, status: 'in-progress' },
            }],
        });
        return { success: true, message: `Created new item: ${itemData.item}`, id: pointId };

      case 'update':
        if (!itemId || !itemData) throw new Error("itemId and itemData are required for 'update' action.");
        const updateVector = await createEmbedding(itemData.embedding_text);
         await qdrantClient.upsert(COLLECTION_NAME, {
            wait: true,
            points: [{
                id: itemId,
                vector: updateVector,
                payload: { ...itemData, userId, status: 'in-progress' },
            }],
        });
        return { success: true, message: `Updated item: ${itemData.item}` };

      case 'complete':
        if (!itemId) throw new Error("itemId is required for 'complete' action.");
        // We 'complete' an item by removing it from the vector DB of in-progress items.
        // It will now live permanently in the user's JSON profile.
        await qdrantClient.delete(COLLECTION_NAME, {
            points: [itemId],
        });
        return { success: true, message: `Completed and removed item ID: ${itemId}` };

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  }
);
