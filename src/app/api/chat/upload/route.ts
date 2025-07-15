import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_API_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const COLLECTION_NAME = 'chat_data';

// Ensure collection exists
async function ensureCollection() {
  try {
    await qdrant.getCollection(COLLECTION_NAME);
  } catch (error) {
    // Collection doesn't exist, create it
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768, // Gemini text-embedding-004 dimension
        distance: 'Cosine',
      },
    });
  }
}

// Create embeddings for text using Gemini
async function createEmbedding(text: string) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, profileData, speechPattern, rawMessages, summary, extractedSkills, keyInsights } = data;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await ensureCollection();

    const vectors = [];
    let pointId = Date.now();

    // 1. Upload speech pattern data
    const speechPatternText = `
      Communication Style: ${speechPattern.communication_style}
      Vocabulary Complexity: ${speechPattern.vocabulary_complexity}
      Sentence Length: ${speechPattern.sentence_length}
      Emotional Tone: ${speechPattern.emotional_tone}
      Technical Depth: ${speechPattern.technical_depth}
      Common Phrases: ${speechPattern.common_phrases.join(', ')}
      Preferred Topics: ${speechPattern.preferred_topics.join(', ')}
    `;

    const speechPatternEmbedding = await createEmbedding(speechPatternText);
    vectors.push({
      id: pointId++,
      vector: speechPatternEmbedding,
      payload: {
        userId,
        type: 'speech_pattern',
        data: speechPattern,
        timestamp: new Date().toISOString(),
      },
    });

    // 2. Upload profile data sections
    if (profileData.education?.length > 0) {
      for (const edu of profileData.education) {
        const eduText = `Education: ${edu.institution}, ${edu.degree}, ${edu.period}${edu.details ? ', ' + edu.details : ''}`;
        const eduEmbedding = await createEmbedding(eduText);
        vectors.push({
          id: pointId++,
          vector: eduEmbedding,
          payload: {
            userId,
            type: 'education',
            data: edu,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    if (profileData.work_experience?.length > 0) {
      for (const work of profileData.work_experience) {
        const workText = `Work Experience: ${work.company}, ${work.role}, ${work.period}. ${work.details.join('. ')}`;
        const workEmbedding = await createEmbedding(workText);
        vectors.push({
          id: pointId++,
          vector: workEmbedding,
          payload: {
            userId,
            type: 'work_experience',
            data: work,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    if (profileData.projects?.length > 0) {
      for (const project of profileData.projects) {
        const projectText = `Project: ${project.name}. ${project.description}. Technologies: ${project.technologies.join(', ')}`;
        const projectEmbedding = await createEmbedding(projectText);
        vectors.push({
          id: pointId++,
          vector: projectEmbedding,
          payload: {
            userId,
            type: 'project',
            data: project,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    if (profileData.leadership_and_activities?.length > 0) {
      for (const leadership of profileData.leadership_and_activities) {
        const leadershipText = `Leadership: ${leadership.organization}, ${leadership.role}, ${leadership.period}${leadership.details ? '. ' + leadership.details.join('. ') : ''}`;
        const leadershipEmbedding = await createEmbedding(leadershipText);
        vectors.push({
          id: pointId++,
          vector: leadershipEmbedding,
          payload: {
            userId,
            type: 'leadership',
            data: leadership,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // 3. Upload skills
    if (profileData.skills?.length > 0) {
      const skillsText = `Skills: ${profileData.skills.join(', ')}`;
      const skillsEmbedding = await createEmbedding(skillsText);
      vectors.push({
        id: pointId++,
        vector: skillsEmbedding,
        payload: {
          userId,
          type: 'skills',
          data: { skills: profileData.skills },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 4. Upload extracted skills from chat
    if (extractedSkills?.length > 0) {
      const extractedSkillsText = `Extracted Skills from Chat: ${extractedSkills.join(', ')}`;
      const extractedSkillsEmbedding = await createEmbedding(extractedSkillsText);
      vectors.push({
        id: pointId++,
        vector: extractedSkillsEmbedding,
        payload: {
          userId,
          type: 'extracted_skills',
          data: { skills: extractedSkills },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 5. Upload conversation summary
    if (summary) {
      const summaryEmbedding = await createEmbedding(summary);
      vectors.push({
        id: pointId++,
        vector: summaryEmbedding,
        payload: {
          userId,
          type: 'conversation_summary',
          data: { summary, keyInsights },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 6. Upload individual user messages (chunked if too long)
    const userMessages = rawMessages.filter((msg: any) => msg.role === 'user');
    for (const message of userMessages) {
      if (typeof message.content === 'string' && message.content.length > 50) { // Only upload substantive messages
        const messageEmbedding = await createEmbedding(message.content);
        vectors.push({
          id: pointId++,
          vector: messageEmbedding,
          payload: {
            userId,
            type: 'user_message',
            data: {
              content: message.content,
              timestamp: message.timestamp,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Upload all vectors to Qdrant
    if (vectors.length > 0) {
      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: vectors,
      });
    }

    return NextResponse.json({
      success: true,
      vectorsCreated: vectors.length,
      message: 'Chat data successfully uploaded to vector database',
    });

  } catch (error) {
    console.error('Error uploading to vector database:', error);
    return NextResponse.json(
      { error: 'Failed to upload to vector database' },
      { status: 500 }
    );
  }
}