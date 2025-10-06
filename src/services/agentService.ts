import { openRouterService, OpenRouterMessage, OpenRouterChatResponse } from './openRouterService';
import { AgentToolsService, AGENT_TOOLS } from './agentToolsService';

/**
 * System prompt for the Quran research agent
 */
const AGENT_SYSTEM_PROMPT = `أنت باحث قرآني ذكي متخصص في القرآن الكريم والدراسات الإسلامية. مهمتك هي مساعدة الباحثين والطلاب في فهم القرآن الكريم بشكل أعمق.

## قدراتك:

### أدوات البحث المتاحة:
1. **search_quran_by_keywords**: البحث النصي في القرآن باستخدام الكلمات المفتاحية (trigram similarity)
   - استخدم هذه الأداة عندما يبحث المستخدم عن كلمات أو عبارات محددة
   - مثال: "ابحث عن آيات تحتوي على كلمة الرحمة"

2. **search_quran_by_meaning**: البحث الدلالي في القرآن باستخدام المعنى (semantic embeddings)
   - استخدم هذه الأداة عندما يبحث المستخدم عن موضوع أو معنى معين
   - مثال: "أريد آيات عن الصبر في المحن" أو "آيات عن العدل الاجتماعي"
   - هذه الأداة تجد آيات مشابهة في المعنى حتى لو لم تحتوي على نفس الكلمات

3. **get_ayah_by_reference**: الحصول على آية محددة بالمرجع
   - استخدم هذه الأداة عندما يطلب المستخدم آية محددة برقمها
   - مثال: "أريد آية الكرسي" (استخدم "2:255")

4. **get_surah_ayahs**: الحصول على آيات سورة كاملة
   - استخدم هذه الأداة عندما يطلب المستخدم سورة كاملة أو جزء منها

5. **search_tafsir**: البحث في التفسير
   - استخدم هذه الأداة للبحث في كتب التفسير

6. **get_tafsir_for_ayah**: الحصول على تفسير آية محددة
   - استخدم هذه الأداة عندما يطلب المستخدم تفسير آية معينة

7. **get_surah_info**: الحصول على معلومات عن سورة
   - استخدم هذه الأداة للحصول على معلومات السورة (الاسم، عدد الآيات، مكية/مدنية)

## إرشادات مهمة:

### متى تستخدم الأدوات:
- **استخدم الأدوات دائماً** عندما يطلب المستخدم معلومات من القرآن أو التفسير
- **لا تخترع** آيات أو معلومات من ذاكرتك - استخدم الأدوات دائماً للحصول على معلومات دقيقة
- **استخدم البحث الدلالي** (search_quran_by_meaning) للأسئلة المفاهيمية والموضوعية
- **استخدم البحث النصي** (search_quran_by_keywords) للبحث عن كلمات محددة

### كيف تقدم الإجابات:
1. **استخدم اللغة العربية الفصحى** في جميع إجاباتك
2. **استخدم Markdown** لتنسيق إجاباتك:
   - استخدم القوائم المرقمة (1. 2. 3.) أو النقطية (- أو *)
   - استخدم **النص الغامق** للتأكيد على النقاط المهمة
   - استخدم النص المميز (backticks) للآيات والمراجع
   - استخدم > للاقتباسات من التفسير
3. **كن دقيقاً ومحترماً** في التعامل مع النصوص المقدسة
4. **استشهد بالآيات** مع ذكر المرجع (السورة:الآية)
5. **قدم السياق** عندما يكون ذلك مفيداً
6. **إذا لم تكن متأكداً**، اذكر ذلك بوضوح
7. **نظم إجابتك** بشكل واضح ومنطقي باستخدام العناوين والقوائم
8. **إذا لم تجد نتائج** من أداة، حاول أداة أخرى (مثلاً: إذا فشل البحث النصي، استخدم البحث الدلالي)

### أمثلة على الاستخدام الصحيح:

**مثال 1 - بحث موضوعي:**
المستخدم: "أريد آيات عن الصبر"
الإجراء: استخدم search_quran_by_meaning مع query: "الصبر والصابرين والمصابرة"
ثم قدم الآيات مع شرح مختصر

**مثال 2 - بحث عن كلمة:**
المستخدم: "ابحث عن كلمة الجنة في القرآن"
الإجراء: استخدم search_quran_by_keywords مع query: "الجنة"
ثم قدم الآيات

**مثال 3 - آية محددة:**
المستخدم: "ما هي آية الكرسي؟"
الإجراء: استخدم get_ayah_by_reference مع ayah_key: "2:255"
ثم قدم الآية مع شرح مختصر

**مثال 4 - تفسير:**
المستخدم: "ما تفسير آية الكرسي؟"
الإجراء: 
1. استخدم get_ayah_by_reference مع ayah_key: "2:255" للحصول على الآية
2. استخدم get_tafsir_for_ayah مع ayah_key: "2:255" للحصول على التفسير
3. قدم الآية والتفسير بشكل منظم

## ملاحظات مهمة:
- يمكنك استخدام أكثر من أداة في نفس الإجابة إذا لزم الأمر
- إذا لم تجد نتائج كافية، حاول صياغة البحث بطريقة مختلفة
- عند البحث الدلالي، استخدم عدة كلمات مرادفة لتحسين النتائج
- text_type_id = 1 يشير إلى النص القرآني البسيط (الافتراضي)`;

/**
 * Agent conversation message with tool calls
 */
export interface AgentMessage extends OpenRouterMessage {
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

/**
 * Agent Service for orchestrating tool calls and LLM interactions
 */
export class AgentService {
  private maxIterations: number = 5;

  constructor(maxIterations: number = 5) {
    this.maxIterations = maxIterations;
  }

  /**
   * Run the agent with tool calling capabilities
   */
  async run(
    userMessage: string,
    model: string,
    conversationHistory: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onToolCall: (toolName: string, args: any, result: any) => void
  ): Promise<{ response: string; usage: any }> {
    console.log('\n========================================');
    console.log('[Agent] Starting agent run');
    console.log(`[Agent] Model: ${model}`);
    console.log(`[Agent] User message: ${userMessage}`);
    console.log(`[Agent] Conversation history: ${conversationHistory.length} messages`);
    console.log('========================================\n');

    // Build messages array with system prompt, conversation history, and new user message
    const messages: AgentMessage[] = [
      {
        role: 'system',
        content: AGENT_SYSTEM_PROMPT,
      },
    ];

    // Add conversation history (excluding the current message which is already in userMessage)
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    console.log(`[Agent] Total messages to send to LLM: ${messages.length}`);
    console.log(`[Agent] Message breakdown: 1 system + ${conversationHistory.length} history + 1 new user message`);

    let iteration = 0;
    let finalResponse = '';
    let totalUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    let lastAssistantMessage: string | null = null;
    let lastToolName: string | null = null;
    let lastToolResult: unknown = null;

    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`\n[Agent] Iteration ${iteration}/${this.maxIterations}`);
      console.log(`[Agent] Current message count: ${messages.length}`);

      try {
        // Call the LLM with tool definitions
        console.log('[Agent] Calling LLM with tools...');
        
        // Log the last message for debugging
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          console.log('[Agent] Last message role:', lastMessage.role);
          if (lastMessage.role === 'tool') {
            console.log('[Agent] Tool message content length:', (lastMessage as any).content?.length || 0);
          }
        }
        
        // Get max tokens based on model
        const maxTokens = this.getMaxTokensForModel(model);
        console.log(`[Agent] Using max_tokens: ${maxTokens} for model: ${model}`);

        const response = await openRouterService.createChatCompletion({
          model,
          messages: messages as OpenRouterMessage[],
          tools: AGENT_TOOLS as any,
          temperature: 0.7,
          max_tokens: maxTokens,
        });

        console.log('[Agent] LLM response received');
        console.log(`[Agent] Finish reason: ${response.choices[0].finish_reason}`);

        // Update usage
        if (response.usage) {
          totalUsage.prompt_tokens += response.usage.prompt_tokens;
          totalUsage.completion_tokens += response.usage.completion_tokens;
          totalUsage.total_tokens += response.usage.total_tokens;
          console.log(`[Agent] Token usage - Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens}`);
        }

        const choice = response.choices[0];
        const message = choice.message;
        if (message.content) {
          lastAssistantMessage = message.content;
        }

        // Check if the model wants to call tools
        const toolCalls = (message as any).tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          console.log(`[Agent] Model requested ${toolCalls.length} tool call(s)`);

          // Add the assistant's message with tool calls to the conversation
          messages.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: toolCalls,
          });

          // Execute each tool call
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log(`\n[Agent] Executing tool: ${toolName}`);
            console.log(`[Agent] Tool arguments:`, toolArgs);

            // Stream a progress message to the user
            const toolNameArabic = this.getToolNameInArabic(toolName);
            onChunk(`\n🔍 ${toolNameArabic}...\n\n`);

            try {
              const toolResult = await AgentToolsService.executeTool(toolName, toolArgs);
              console.log(`[Agent] Tool execution successful`);
              console.log(`[Agent] Tool result:`, JSON.stringify(toolResult, null, 2));

              // Notify about tool call
              onToolCall(toolName, toolArgs, toolResult);

              // Stream completion message
              const resultCount = Array.isArray(toolResult) ? toolResult.length : (toolResult ? 1 : 0);
              if (resultCount > 0) {
                onChunk(`✅ تم العثور على ${resultCount} نتيجة\n\n`);
              } else {
                onChunk(`⚠️ لم يتم العثور على نتائج\n\n`);
              }

              // Format tool result with helpful context for the LLM
              let toolResultContent: string;
              let fallbackResult: unknown = null;

              if (Array.isArray(toolResult) && toolResult.length === 0) {
                toolResultContent = JSON.stringify({
                  status: 'no_results',
                  message: 'لم يتم العثور على نتائج لهذا البحث. يمكنك المحاولة بكلمات مختلفة أو استخدام البحث الدلالي.',
                });
                fallbackResult = {
                  status: 'no_results',
                  message: 'لم يتم العثور على نتائج لهذا البحث. يمكنك المحاولة بكلمات مختلفة أو استخدام البحث الدلالي.',
                };
              } else if (toolResult === null) {
                toolResultContent = JSON.stringify({
                  status: 'not_found',
                  message: 'لم يتم العثور على البيانات المطلوبة.',
                });
                fallbackResult = {
                  status: 'not_found',
                  message: 'لم يتم العثور على البيانات المطلوبة.',
                };
              } else {
                // Limit the number of results to avoid context length issues
                let limitedResult = toolResult;
                if (Array.isArray(toolResult) && toolResult.length > 10) {
                  console.log(`[Agent] Limiting results from ${toolResult.length} to 10 to avoid context issues`);
                  limitedResult = toolResult.slice(0, 10);
                }
                toolResultContent = JSON.stringify(limitedResult);
                fallbackResult = limitedResult;
              }

              lastToolResult = fallbackResult;
              lastToolName = toolName;

              console.log(`[Agent] Tool result content length: ${toolResultContent.length} characters`);

              // Add tool result to messages
              // For Anthropic/Claude, we need to use the correct format
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: toolResultContent,
              } as any);
            } catch (error) {
              console.error(`[Agent] Tool execution failed:`, error);
              
              // Add error message as tool result
              messages.push({
                role: 'tool',
                name: toolName,
                content: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Tool execution failed',
                }),
              } as any);
            }
          }

          // Continue to next iteration to get the final response
          console.log('[Agent] Tool calls completed, continuing to next iteration...');
          continue;
        }

        // No tool calls, this is the final response
        console.log('[Agent] No tool calls requested, this is the final response');
        finalResponse = message.content || '';
        
        // Stream the response to the client
        console.log('[Agent] Streaming final response to client...');
        for (const char of finalResponse) {
          onChunk(char);
        }

        console.log('\n[Agent] Agent run completed successfully');
        console.log(`[Agent] Total iterations: ${iteration}`);
        console.log(`[Agent] Total tokens used: ${totalUsage.total_tokens}`);
        console.log('========================================\n');

        return {
          response: finalResponse,
          usage: totalUsage,
        };
      } catch (error) {
        console.error(`[Agent] Error in iteration ${iteration}:`, error);
        throw error;
      }
    }

    // Max iterations reached
    console.warn('[Agent] Max iterations reached without final response');
    const fallbackParts: string[] = [];
    fallbackParts.push('⚠️ بلغ الوكيل الحد الأقصى من المحاولات قبل صياغة إجابة نهائية.');

    if (lastAssistantMessage && lastAssistantMessage.trim().length > 0) {
      fallbackParts.push(lastAssistantMessage.trim());
    } else if (lastToolResult) {
      fallbackParts.push(this.formatFallbackToolResult(lastToolName, lastToolResult));
    } else {
      fallbackParts.push('لم يتمكّن الوكيل من إرجاع بيانات إضافية، لكن تم تنفيذ الأدوات المطلوبة قبل التوقّف.');
    }

    const fallbackResponse = fallbackParts.join('\n\n');
    onChunk(fallbackResponse);

    return {
      response: fallbackResponse,
      usage: totalUsage,
    };
  }

  /**
   * Run the agent with streaming support
   */
  async runStreaming(
    userMessage: string,
    model: string,
    conversationHistory: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onToolCall: (toolName: string, args: any, result: any) => void
  ): Promise<{ response: string; usage: any }> {
    // For now, we'll use the non-streaming version and simulate streaming
    // In a production environment, you'd want to implement proper streaming with tool calls
    return await this.run(userMessage, model, conversationHistory, onChunk, onToolCall);
  }

  /**
   * Get tool name in Arabic for user-friendly messages
   */
  private getToolNameInArabic(toolName: string): string {
    const toolNames: Record<string, string> = {
      'search_quran_by_keywords': 'جاري البحث في القرآن بالكلمات المفتاحية',
      'search_quran_by_meaning': 'جاري البحث الدلالي في القرآن',
      'get_ayah_by_reference': 'جاري جلب الآية',
      'get_surah_ayahs': 'جاري جلب آيات السورة',
      'search_tafsir': 'جاري البحث في التفسير',
      'get_tafsir_for_ayah': 'جاري جلب تفسير الآية',
      'get_surah_info': 'جاري جلب معلومات السورة',
    };
    return toolNames[toolName] || 'جاري تنفيذ العملية';
  }

  /**
   * Get maximum output tokens for a given model
   * These are the max completion tokens, not total context length
   */
  private getMaxTokensForModel(model: string): number {
    // Map of model patterns to their max completion tokens
    const modelLimits: Record<string, number> = {
      // OpenAI models
      'gpt-4o': 16384,
      'gpt-4o-mini': 16384,
      'gpt-4-turbo': 4096,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      
      // Anthropic Claude models
      'claude-3.5-sonnet': 8192,
      'claude-3-opus': 4096,
      'claude-3-sonnet': 4096,
      'claude-3-haiku': 4096,
      'claude-2': 4096,
      
      // Google models
      'gemini-pro': 8192,
      'gemini-1.5-pro': 8192,
      'gemini-1.5-flash': 8192,
      
      // Meta Llama models
      'llama-3.1-405b': 4096,
      'llama-3.1-70b': 4096,
      'llama-3.1-8b': 4096,
      'llama-3-70b': 4096,
      'llama-3-8b': 4096,
      
      // Mistral models
      'mistral-large': 4096,
      'mistral-medium': 4096,
      'mistral-small': 4096,
      'mixtral-8x7b': 4096,
      'mixtral-8x22b': 4096,
      
      // Cohere models
      'command-r-plus': 4096,
      'command-r': 4096,
      
      // Default fallback
      'default': 4096,
    };

    // Try to match the model name with known patterns
    for (const [pattern, maxTokens] of Object.entries(modelLimits)) {
      if (model.toLowerCase().includes(pattern.toLowerCase())) {
        return maxTokens;
      }
    }

    // Return default if no match found
    console.log(`[Agent] Unknown model: ${model}, using default max_tokens: ${modelLimits.default}`);
    return modelLimits.default;
  }

  private formatFallbackToolResult(toolName: string | null, toolResult: unknown): string {
    const toolLabel = toolName ? this.getToolNameInArabic(toolName) : 'العملية الأخيرة';

    if (typeof toolResult === 'string') {
      return `${toolLabel}:\n${toolResult}`;
    }

    try {
      return `${toolLabel}:\n${JSON.stringify(toolResult, null, 2)}`;
    } catch (error) {
      console.error('[Agent] Failed to format fallback tool result:', error);
      return `${toolLabel}:\nتعذّر عرض نتيجة الأداة، لكنها أُعيدت إلى الوكيل بنجاح.`;
    }
  }
}

// Export singleton instance
export const agentService = new AgentService();
