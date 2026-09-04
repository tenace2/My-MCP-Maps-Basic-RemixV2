/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ChatState, marked, Playground } from './playground';
import { registerSW } from 'virtual:pwa-register';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

registerSW({ immediate: true });

async function sendPromptToBackend(prompt: string): Promise<{ reply: string; mapHint: string; places: string[]; debug: string; statusCode: number; durationMs: number; rawResponse: string; model: string; inputTokens: number; outputTokens: number; errorStatus: number | null; errorMessage: string; errorDetails: string; usageToday: { date: string; attempted: number; success: number; error: number } | null }> {
  const startedAt = performance.now();
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.errorMessage === 'string'
      ? errorData.errorMessage
      : typeof errorData.error === 'string'
        ? errorData.error
        : 'Unable to reach the backend.';
    const errorDetails = typeof errorData.errorDetails === 'string'
      ? errorData.errorDetails
      : '';
    const errorStatus = typeof errorData.errorStatus === 'number' ? errorData.errorStatus : response.status;
    const usageToday = errorData.usageToday && typeof errorData.usageToday === 'object' ? errorData.usageToday : null;

    const error = new Error(errorMessage) as Error & { status?: number; errorMessage?: string; errorDetails?: string; usageToday?: typeof usageToday };
    error.status = errorStatus;
    error.errorMessage = errorMessage;
    error.errorDetails = errorDetails;
    error.usageToday = usageToday;
    throw error;
  }

  const data = await response.json();
  const durationMs = Math.round(performance.now() - startedAt);
  return {
    reply: data.reply || 'No response from the backend.',
    mapHint: typeof data.mapHint === 'string' ? data.mapHint : '',
    places: Array.isArray(data.places) ? data.places.filter(Boolean) : [],
    debug: typeof data.debug === 'string' ? data.debug : '',
    statusCode: response.status,
    durationMs,
    rawResponse: JSON.stringify(data, null, 2),
    model: typeof data.model === 'string' ? data.model : 'unknown',
    inputTokens: typeof data.inputTokens === 'number' ? data.inputTokens : 0,
    outputTokens: typeof data.outputTokens === 'number' ? data.outputTokens : 0,
    errorStatus: typeof data.errorStatus === 'number' ? data.errorStatus : null,
    errorMessage: typeof data.errorMessage === 'string' ? data.errorMessage : '',
    errorDetails: typeof data.errorDetails === 'string' ? data.errorDetails : '',
    usageToday: data.usageToday && typeof data.usageToday === 'object' ? data.usageToday : null,
  };
}

const EXAMPLE_PROMPTS = [
  'Where is something cool to see',
  'Show me San Francisco',
  'Where is a place with a tilted tower?',
  'Show me Mount Everest',
  'Can you show me Mauna Kea in Hawaii?',
  "Let's go to Venice, Italy.",
  'Take me to the northernmost capital city in the world',
  "How about the southernmost permanently inhabited settlement? What's it called and where is it?",
  'Show me the location of the ancient city of Petra in Jordan',
  "Let's jump to Machu Picchu in Peru",
  "Can you show me the Three Gorges Dam in China?",
  "Can you find a town or city with a really funny or unusual name and show it to me?"
];

document.addEventListener('DOMContentLoaded', async () => {
  const rootElement = document.querySelector('#root')! as HTMLElement;

  const playground = new Playground();
  rootElement.appendChild(playground);

  playground.renderMapQuery({ location: 'London' });


  playground.sendMessageHandler = async (
    input: string,
    role: string,
  ) => {
    console.log('sendMessageHandler', input, role);

    const { thinking, text } = playground.addMessage('assistant', '');
    playground.setChatState(ChatState.GENERATING);
    text.innerHTML = '...';

    try {
      const result = await sendPromptToBackend(input);
      const placeList = result.places.length > 0
        ? `\n\nPlaces to explore:\n- ${result.places.join('\n- ')}`
        : '';
      text.innerHTML = await marked.parse(`${result.reply}${placeList}`);

      if (result.mapHint.trim()) {
        const searchQuery = result.mapHint.trim();
        playground.renderMapQuery({ search: searchQuery });
      }

      playground.setDiagnostics({
        status: 'ok',
        responseText: result.rawResponse,
        mapHint: result.mapHint,
        places: result.places,
        debug: `${result.debug} | status=${result.statusCode} | duration=${result.durationMs}ms`,
        statusCode: result.statusCode,
        durationMs: result.durationMs,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        errorStatus: result.errorStatus,
        errorMessage: result.errorMessage,
        errorDetails: result.errorDetails,
        usageToday: result.usageToday,
      });
    } catch (error: any) {
      console.error('Backend request failed:', error);
      const errorMessage = typeof error?.errorMessage === 'string' ? error.errorMessage : error.message || 'Unable to reach the backend.';
      const errorDetails = typeof error?.errorDetails === 'string' ? error.errorDetails : '';
      const errorStatus = typeof error?.status === 'number' ? error.status : 0;
      const usageToday = error?.usageToday && typeof error.usageToday === 'object' ? error.usageToday : null;
      const { text: errorText } = playground.addMessage('error', '');
      errorText.innerHTML = errorMessage;
      playground.setDiagnostics({
        status: 'error',
        responseText: errorMessage,
        mapHint: '',
        places: [],
        debug: `${errorMessage}${errorStatus ? ` | status=${errorStatus}` : ''}`,
        statusCode: errorStatus,
        durationMs: 0,
        model: 'unknown',
        inputTokens: 0,
        outputTokens: 0,
        errorStatus,
        errorMessage,
        errorDetails,
        usageToday,
      });
    }

    thinking.parentElement!.removeAttribute('open');

    if (text.innerHTML.trim().length === 0) {
      text.innerHTML = 'Done';
    }

    playground.setChatState(ChatState.IDLE);
  };

  playground.setInputField(
    EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)],
  );
});
