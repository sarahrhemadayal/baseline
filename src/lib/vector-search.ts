import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const COLLECTION_NAME = 'chat_data';

export interface SearchResult {
  id: string;
  score: number;
  payload: {
    userId: string;
    type: string;
    data: any;
    timestamp: string;
  };
}

function hasSkills(data: any): data is { skills: string[] } {
  return data && Array.isArray(data.skills);
}

export class VectorSearch {
  static async createEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  static async searchSimilar(
  query: string,
  userId: string,
  limit: number = 10,
  type?: string
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await this.createEmbedding(query);

    const filter: any = {
      must: [
        {
          key: 'userId',
          match: { value: userId }
        }
      ]
    };

    if (type) {
      filter.must.push({
        key: 'type',
        match: { value: type }
      });
    }

    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      filter,
      with_payload: true,
    });

    const MAX_TEXT_LENGTH = 500;

    return searchResult.map(result => {
      const rawPayload = result.payload as {
        userId: string;
        type: string;
        data: any;
        timestamp: string;
      };

      let data = rawPayload?.data || {};

      // Truncate if data contains large text fields
      if (typeof data === 'string') {
        data = data.slice(0, MAX_TEXT_LENGTH);
      } else if (typeof data.description === 'string') {
        data.description = data.description.slice(0, MAX_TEXT_LENGTH);
      } else if (typeof data.embedding_text === 'string') {
        data.embedding_text = data.embedding_text.slice(0, MAX_TEXT_LENGTH);
      }

      return {
        id: result.id.toString(),
        score: result.score || 0,
        payload: {
          userId: rawPayload.userId,
          type: rawPayload.type,
          timestamp: rawPayload.timestamp,
          data,
        },
      };
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}



  static async getUserSpeechPattern(userId: string): Promise<any | null> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit: 1,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { key: 'type', match: { value: 'speech_pattern' } }
          ]
        },
        with_payload: true,
      });

      return results.length > 0 ? results[0].payload?.data : null;
    } catch (error) {
      console.error('Error fetching speech pattern:', error);
      return null;
    }
  }

  static async getUserSkills(userId: string): Promise<string[]> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit: 10,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { 
              should: [
                { key: 'type', match: { value: 'skills' } },
                { key: 'type', match: { value: 'extracted_skills' } }
              ]
            }
          ]
        },
        with_payload: true,
      });

      const allSkills: string[] = [];
      results.forEach(result => {
        if (hasSkills(result.payload?.data)) {
            allSkills.push(...result.payload.data.skills);
        }
        });


      return [...new Set(allSkills)]; // Remove duplicates
    } catch (error) {
      console.error('Error fetching skills:', error);
      return [];
    }
  }

  static async getUserProjects(userId: string): Promise<any[]> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit: 20,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { key: 'type', match: { value: 'project' } }
          ]
        },
        with_payload: true,
      });

      return results.map(result => result.payload?.data).filter(Boolean);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getUserWorkExperience(userId: string): Promise<any[]> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit: 20,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { key: 'type', match: { value: 'work_experience' } }
          ]
        },
        with_payload: true,
      });

      return results.map(result => result.payload?.data).filter(Boolean);
    } catch (error) {
      console.error('Error fetching work experience:', error);
      return [];
    }
  }

  static async getConversationInsights(userId: string): Promise<any[]> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit: 10,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { key: 'type', match: { value: 'conversation_summary' } }
          ]
        },
        with_payload: true,
      });

      return results.map(result => result.payload?.data).filter(Boolean);
    } catch (error) {
      console.error('Error fetching conversation insights:', error);
      return [];
    }
  }

  static async deleteUserData(userId: string): Promise<boolean> {
    try {
      await qdrant.delete(COLLECTION_NAME, {
        filter: {
          must: [
            { key: 'userId', match: { value: userId } }
          ]
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }

  static async getRecentUserMessages(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: Array(768).fill(0), // Dummy vector - updated for Gemini embedding dimension
        limit,
        filter: {
          must: [
            { key: 'userId', match: { value: userId } },
            { key: 'type', match: { value: 'user_message' } }
          ]
        },
        with_payload: true,
      });

      return results
        .map(result => result.payload?.data as { timestamp: string })
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }
}