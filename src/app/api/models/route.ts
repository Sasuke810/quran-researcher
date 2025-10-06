import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/services/openRouterService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const popular = url.searchParams.get('popular') === 'true';

    let models;
    if (popular) {
      models = await openRouterService.getPopularModels();
    } else {
      models = await openRouterService.getModels();
    }

    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      },
      { status: 500 }
    );
  }
}
