import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { GUIDED_SYSTEM_PROMPT, simulationSchema } from '@/lib/ai/knowledge';
import { logConversation, generateSessionId } from '@/lib/logging/conversation-logger';

export async function POST(req: Request) {
  const { messages, sessionId: existingSessionId } = await req.json();

  // Generate or use existing session ID for logging
  const sessionId = existingSessionId || generateSessionId();

  // Log the conversation
  try {
    logConversation(sessionId, messages);
  } catch (error) {
    console.error('Failed to log conversation:', error);
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: GUIDED_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      // =================================================================
      // EXISTING SIMULATION TOOL
      // =================================================================
      generateSimulation: tool({
        description:
          'Generate a variance simulation chart with the specified parameters. Call this when the user has confirmed their winrate, standard deviation, and number of hands to simulate.',
        inputSchema: simulationSchema,
      }),

      // =================================================================
      // DATA COLLECTION TOOLS
      // These tools render UI and wait for user input
      // =================================================================
      askGameFormat: tool({
        description:
          'Ask user to select their poker game format. Use when you need to know what type of poker they play. The user will select from chips and their response will come in the next message.',
        inputSchema: z.object({
          question: z
            .string()
            .describe('The question to ask, phrased naturally'),
          allowMultiple: z
            .boolean()
            .default(false)
            .describe('Allow selecting multiple formats'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_selection' };
        },
      }),

      askEnvironment: tool({
        description:
          'Ask if user plays online or live. Use when environment is needed for calculations. The user will select from chips and their response will come in the next message.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_selection' };
        },
      }),

      askStakes: tool({
        description: 'Ask user to select their stakes level. The user will select from chips and their response will come in the next message.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
          environment: z
            .enum(['online', 'live'])
            .describe('Which stake options to show'),
        }),
        execute: async ({ question, environment }) => {
          return { rendered: true, question, environment, awaiting: 'user_selection' };
        },
      }),

      askWinrate: tool({
        description:
          'Ask user about their winrate with options for unknown. The user will respond with their winrate or indicate they don\'t know.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
          showInput: z
            .boolean()
            .describe('Whether to show numeric input immediately'),
          showDontKnow: z
            .boolean()
            .default(true)
            .describe('Include "I don\'t know" option'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_input' };
        },
      }),

      askSampleSize: tool({
        description:
          'Ask user about their sample size (hands or hours played). The user will respond with their sample size.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
          type: z
            .enum(['hands', 'hours', 'ask'])
            .describe(
              'What type of input to show - "ask" lets user choose'
            ),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_input' };
        },
      }),

      askExperienceLevel: tool({
        description:
          'Ask about player experience level. ALWAYS ask this BEFORE asking about winrate. This determines whether to ask for winrate directly (professionals) or estimate it (everyone else).',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_selection' };
        },
      }),

      askOverallResults: tool({
        description:
          'Ask how the player has been doing overall. Use this for NON-PROFESSIONAL players instead of asking their winrate directly. Options: winning consistently, slightly ahead, break-even, slightly behind, losing, not sure.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_selection' };
        },
      }),

      askTimeAtStakes: tool({
        description:
          'Ask how long the player has been playing at their current stakes. Use this for NON-PROFESSIONAL players to calibrate confidence in their results. Options: just starting, few months, 6+ months, 1+ years.',
        inputSchema: z.object({
          question: z.string().describe('The question to ask'),
        }),
        execute: async ({ question }) => {
          return { rendered: true, question, awaiting: 'user_selection' };
        },
      }),

      // =================================================================
      // DISPLAY TOOLS
      // These tools render information for the user
      // =================================================================
      showAssessment: tool({
        description:
          'Display an assessment or insight card to the user. Use for sharing observations, warnings, or helpful context.',
        inputSchema: z.object({
          title: z.string().describe('Assessment title'),
          content: z.string().describe('Assessment content/explanation'),
          type: z.enum(['info', 'warning', 'success', 'insight']),
          flags: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
                status: z.enum(['good', 'warning', 'neutral']),
              })
            )
            .optional()
            .describe('Optional status flags to display'),
        }),
        execute: async ({ title, content, type }) => {
          return { displayed: true, title, type };
        },
      }),

      showBankrollRecommendation: tool({
        description:
          'Display bankroll sizing recommendation. Call after collecting all necessary data (winrate, format, stakes, environment).',
        inputSchema: z.object({
          calculationInputs: z.object({
            winrate: z.number().describe('Winrate in BB/100'),
            stdDev: z.number().describe('Standard deviation in BB/100'),
            environment: z.enum(['online', 'live']),
            stakes: z.string().describe('Stakes label'),
            bigBlind: z.number().describe('Big blind in dollars'),
          }),
          riskTolerance: z
            .enum(['conservative', 'moderate', 'aggressive'])
            .default('moderate'),
        }),
        execute: async ({ calculationInputs, riskTolerance }) => {
          return {
            displayed: true,
            winrate: calculationInputs.winrate,
            stakes: calculationInputs.stakes,
            riskTolerance,
          };
        },
      }),

      showResultsAnalysis: tool({
        description:
          'Display analysis of user\'s results or downswing. Call after collecting winrate, sample size, and result details.',
        inputSchema: z.object({
          calculationInputs: z.object({
            winrate: z.number().describe('Expected winrate in BB/100'),
            stdDev: z.number().describe('Standard deviation in BB/100'),
            hands: z.number().describe('Number of hands played'),
            observedWinrate: z
              .number()
              .optional()
              .describe('Observed winrate if known'),
            buyInsLost: z
              .number()
              .optional()
              .describe('Buy-ins lost in downswing'),
          }),
        }),
        execute: async ({ calculationInputs }) => {
          return {
            displayed: true,
            winrate: calculationInputs.winrate,
            hands: calculationInputs.hands,
          };
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  const response = result.toUIMessageStreamResponse();

  // Add session ID to response headers for client persistence
  response.headers.set('X-Session-Id', sessionId);

  return response;
}
