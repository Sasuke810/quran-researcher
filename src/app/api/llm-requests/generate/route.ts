import { NextRequest } from 'next/server';
import { agentService } from '@/services/agentService';
import { LlmRequestRepository, getDbConnection } from '@/lib';

const db = getDbConnection();
const llmRequestRepository = new LlmRequestRepository(db);

export async function POST(request: NextRequest) {
  try {
    const { requestId, model, prompt, conversationHistory } = await request.json();

    if (!requestId || !model || !prompt) {
      console.error('[API] Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: requestId, model, and prompt are required',
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the request exists
    const llmRequest = await llmRequestRepository.findById(requestId);
    if (!llmRequest) {
      console.error(`[API] Request not found: ${requestId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request not found',
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }


    // Create a streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';
    const toolCalls: any[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {

          // Run the agent with tool calling and conversation history
          const result = await agentService.run(
            prompt,
            model,
            conversationHistory || [],
            // onChunk - send each chunk to the client
            (chunk: string) => {
              fullResponse += chunk;
              const data = JSON.stringify({ 
                type: 'chunk', 
                content: chunk 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            },
            // onToolCall - log and send tool call info to client
            (toolName: string, args: any, result: any) => {
              console.log(`[API] Tool call completed: ${toolName}`);
              
              const toolCallData = {
                tool: toolName,
                arguments: args,
                result: result,
                timestamp: new Date().toISOString(),
              };
              
              toolCalls.push(toolCallData);

              // Send tool call notification to client
              const data = JSON.stringify({ 
                type: 'tool_call', 
                data: toolCallData
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          );

          console.log('[API] Agent run completed');
          console.log(`[API] Full response length: ${fullResponse.length} characters`);
          console.log(`[API] Tool calls made: ${toolCalls.length}`);

          // Update the request with the full response
          await llmRequestRepository.update(requestId, {
            response: fullResponse,
          });


          // Send completion event
          const data = JSON.stringify({ 
            type: 'done', 
            requestId: requestId,
            fullResponse: fullResponse,
            usage: result.usage,
            toolCalls: toolCalls,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();

        } catch (error) {
          console.error('[API] Error in stream:', error);
          const data = JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Failed to generate response' 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Error generating LLM response:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate response',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
