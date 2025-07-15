import { NextRequest, NextResponse } from 'next/server';
import { VectorSearch } from '@/lib/vector-search';

export async function POST(request: NextRequest) {
  try {
    const { query, userId, limit = 10, type } = await request.json();

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    const results = await VectorSearch.searchSimilar(query, userId, limit, type);

    return NextResponse.json({
      results,
      query,
      userId,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let data;
    
    switch (action) {
      case 'speech_pattern':
        data = await VectorSearch.getUserSpeechPattern(userId);
        break;
      case 'skills':
        data = await VectorSearch.getUserSkills(userId);
        break;
      case 'projects':
        data = await VectorSearch.getUserProjects(userId);
        break;
      case 'work_experience':
        data = await VectorSearch.getUserWorkExperience(userId);
        break;
      case 'insights':
        data = await VectorSearch.getConversationInsights(userId);
        break;
      case 'recent_messages':
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await VectorSearch.getRecentUserMessages(userId, limit);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const success = await VectorSearch.deleteUserData(userId);

    if (success) {
      return NextResponse.json({ message: 'User data deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete user data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}