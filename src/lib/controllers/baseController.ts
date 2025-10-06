import { NextRequest, NextResponse } from 'next/server';
import { PaginationOptions } from '../models/types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export abstract class BaseController {
  protected createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message
    });
  }

  protected createErrorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error
    }, { status });
  }

  protected createPaginatedResponse<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message?: string
  ): NextResponse<ApiResponse<T[]>> {
    return NextResponse.json({
      success: true,
      data,
      message,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }

  protected extractPaginationFromRequest(request: NextRequest): PaginationOptions {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Cap at 100 items per page
      offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit))
    };
  }

  protected async handleRequest<T>(
    handler: () => Promise<T>,
    errorMessage: string = 'An error occurred'
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      const result = await handler();
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(errorMessage, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : errorMessage,
        500
      );
    }
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return `Field '${field}' is required`;
      }
    }
    return null;
  }
}
