import { NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/logging/conversation-logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { sessionId, rating, issues, comment, timestamp } = body;

    // Validate required fields
    if (!rating || !['helpful', 'somewhat', 'not_helpful'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid rating' },
        { status: 400 }
      );
    }

    // Save feedback
    saveFeedback({
      sessionId: sessionId || null,
      rating,
      issues: issues || [],
      comment,
      timestamp: timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
