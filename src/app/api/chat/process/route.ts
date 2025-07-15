import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Schemas
const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  period: z.string(),
  details: z.string().optional(),
});

const WorkExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  details: z.array(z.string()),
});

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
});

const LeadershipActivitySchema = z.object({
  organization: z.string(),
  role: z.string(),
  period: z.string(),
  details: z.array(z.string()).optional(),
});

const ProfileSchema = z.object({
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  education: z.array(EducationSchema),
  work_experience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema),
  leadership_and_activities: z.array(LeadershipActivitySchema).optional(),
  skills: z.array(z.string()),
  interests: z.array(z.string()).optional(),
});


const SpeechPatternSchema = z.object({
  vocabulary_complexity: z.enum(['basic', 'intermediate', 'advanced']).nullable(),
  sentence_length: z.enum(['short', 'medium', 'long']).nullable(),
  communication_style: z.enum(['formal', 'casual', 'technical', 'conversational']).nullable(),
  emotional_tone: z.enum(['positive', 'neutral', 'analytical', 'enthusiastic']).nullable(),
  technical_depth: z.enum(['surface', 'moderate', 'deep']).nullable(),
  common_phrases: z.array(z.string()),
  preferred_topics: z.array(z.string()),
});


export async function POST(request: NextRequest) {
  try {
    const { userId, messages } = await request.json();

    if (!userId || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    const conversationText = userMessages.map((msg: any) => msg.content).join('\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare prompts
    const speechPatternPrompt = `
      Analyze these messages and return JSON matching:
      {
        "vocabulary_complexity": "basic|intermediate|advanced",
        "sentence_length": "short|medium|long",
        "communication_style": "formal|casual|technical|conversational",
        "emotional_tone": "positive|neutral|analytical|enthusiastic",
        "technical_depth": "surface|moderate|deep",
        "common_phrases": ["phrase1", "phrase2"],
        "preferred_topics": ["topic1", "topic2"]
      }
      Never use "N/A", "unknown", or "none". Always choose the nearest valid option.
      Return only valid JSON, no markdown.
      Messages:
      ${conversationText}
      `;

    const profilePrompt = `
Extract professional profile info from these messages and return JSON:
{
  "name": "optional",
  "title": "optional",
  "email": "optional",
  "phone": "optional",
  "linkedin": "optional",
  "github": "optional",
  "education": [],
  "work_experience": [],
  "projects": [],
  "leadership_and_activities": [],
  "skills": [],
  "interests": []
}
Messages:
${conversationText}
`;

    const summaryPrompt = `
Summarize the conversation, find key insights and skills. Return JSON:
{
  "summary": "text",
  "keyInsights": ["..."],
  "extractedSkills": ["..."]
}
Messages:
${messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
`;

    // Call Gemini properly
    const speechPatternRes = await model.generateContent([
      "You are an expert on communication patterns. Return only valid JSON.",
      speechPatternPrompt
    ]);
    const profileRes = await model.generateContent([
      "You are an expert on extracting professional profiles. Return only valid JSON.",
      profilePrompt
    ]);
    const summaryRes = await model.generateContent([
      "You are an expert at summarizing conversations. Return only valid JSON.",
      summaryPrompt
    ]);

    // Extract text (await!)
    const speechPatternText = await speechPatternRes.response.text();
    const profileText = await profileRes.response.text();
    const summaryText = await summaryRes.response.text();

    // Clean JSON
    const cleanJson = (text: string) => 
      text.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    // Parse & validate
    const speechPattern = SpeechPatternSchema.parse(JSON.parse(cleanJson(speechPatternText)));
    const rawProfile = JSON.parse(cleanJson(profileText));
    const profileData = ProfileSchema.parse(
      Array.isArray(rawProfile) ? (rawProfile[0] || {}) : rawProfile
    );
    const summaryData = JSON.parse(cleanJson(summaryText));

    return NextResponse.json({
      userId,
      profileData,
      speechPattern,
      summary: summaryData.summary || 'No summary available',
      extractedSkills: summaryData.extractedSkills || [],
      keyInsights: summaryData.keyInsights || [],
      rawMessages: messages,
    });

  } catch (err: any) {
    console.error('Error processing chat messages:', err);
    return NextResponse.json({ error: 'Failed to process messages', detail: err?.message }, { status: 500 });
  }
}
