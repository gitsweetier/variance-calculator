'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameFormatSelector,
  EnvironmentSelector,
  StakesSelector,
  WinrateInput,
  SampleSizeInput,
  ExperienceLevelSelector,
  OverallResultsSelector,
  TimeAtStakesSelector,
  AssessmentCard,
  BankrollRecommendation,
  ResultsAnalysis,
} from './tools';
import { SimulationTool } from './SimulationTool';
import { FeedbackButton } from './FeedbackButton';
import type { SimulationParams } from '@/lib/ai/knowledge';
import type {
  AskGameFormatParams,
  AskEnvironmentParams,
  AskStakesParams,
  AskWinrateParams,
  AskSampleSizeParams,
  AskExperienceLevelParams,
  AskOverallResultsParams,
  AskTimeAtStakesParams,
  ShowAssessmentParams,
  ShowBankrollRecommendationParams,
  ShowResultsAnalysisParams,
} from '@/lib/ai/types';

// Check if a message is a tool response (should be hidden from user view)
function isToolResponse(text: string): boolean {
  return (
    text.startsWith('[FORMAT:') ||
    text.startsWith('[ENV:') ||
    text.startsWith('[STAKES:') ||
    text.startsWith('[WINRATE:') ||
    text.startsWith('[SAMPLE:') ||
    text.startsWith('[EXPERIENCE:') ||
    text.startsWith('[RESULTS:') ||
    text.startsWith('[TIME:')
  );
}

// Generate a session ID for this chat
function generateSessionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${dateStr}_${timeStr}_${random}`;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  // Generate session ID once on mount
  const [sessionId] = useState<string>(() => generateSessionId());
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Pass sessionId in request body for logging
      body: { sessionId },
    }),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Handle responses from interactive tool components
  const handleToolResponse = useCallback(
    (response: string) => {
      sendMessage({ text: response });
    },
    [sendMessage]
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  // Render a tool component based on type
  const renderToolComponent = (
    toolType: string,
    params: unknown,
    key: number
  ) => {
    switch (toolType) {
      // Interactive data collection tools
      case 'tool-askGameFormat':
        return (
          <GameFormatSelector
            key={key}
            params={params as AskGameFormatParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askEnvironment':
        return (
          <EnvironmentSelector
            key={key}
            params={params as AskEnvironmentParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askStakes':
        return (
          <StakesSelector
            key={key}
            params={params as AskStakesParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askWinrate':
        return (
          <WinrateInput
            key={key}
            params={params as AskWinrateParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askSampleSize':
        return (
          <SampleSizeInput
            key={key}
            params={params as AskSampleSizeParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askExperienceLevel':
        return (
          <ExperienceLevelSelector
            key={key}
            params={params as AskExperienceLevelParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askOverallResults':
        return (
          <OverallResultsSelector
            key={key}
            params={params as AskOverallResultsParams}
            onResponse={handleToolResponse}
          />
        );
      case 'tool-askTimeAtStakes':
        return (
          <TimeAtStakesSelector
            key={key}
            params={params as AskTimeAtStakesParams}
            onResponse={handleToolResponse}
          />
        );

      // Display tools
      case 'tool-showAssessment':
        return (
          <AssessmentCard
            key={key}
            params={params as ShowAssessmentParams}
            onResponse={() => {}}
          />
        );
      case 'tool-showBankrollRecommendation':
        return (
          <BankrollRecommendation
            key={key}
            params={params as ShowBankrollRecommendationParams}
            onResponse={() => {}}
          />
        );
      case 'tool-showResultsAnalysis':
        return (
          <ResultsAnalysis
            key={key}
            params={params as ShowResultsAnalysisParams}
            onResponse={() => {}}
          />
        );
      case 'tool-generateSimulation':
        return <SimulationTool key={key} params={params as SimulationParams} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Variance Expert</h1>
        <p className="text-gray-500 mt-1">
          Describe your poker situation and I&apos;ll help you understand variance
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <p className="text-gray-500 mb-4">
                Hi! I&apos;m your poker variance expert. Tell me about your game and
                I&apos;ll help you understand how variance affects your results.
              </p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Try: &quot;What bankroll do I need for $2/$5 live?&quot;</p>
                <p>Or: &quot;I&apos;ve lost 10 buy-ins this month - is that normal?&quot;</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {/* User message - hide tool responses */}
                {message.role === 'user' && (
                  <>
                    {message.parts.map((part, i) => {
                      if (part.type === 'text') {
                        // Hide tool response messages
                        if (isToolResponse(part.text)) {
                          return null;
                        }
                        return (
                          <div key={i} className="flex justify-end">
                            <div className="max-w-[80%] rounded-lg bg-blue-500 px-4 py-2 text-white">
                              <p className="whitespace-pre-wrap">{part.text}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </>
                )}

                {/* Assistant message */}
                {message.role === 'assistant' && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] space-y-3">
                      {message.parts.map((part, i) => {
                        // Text content
                        if (part.type === 'text' && part.text) {
                          return (
                            <div
                              key={i}
                              className="rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-100"
                            >
                              <p className="whitespace-pre-wrap text-gray-900">
                                {part.text}
                              </p>
                            </div>
                          );
                        }

                        // Tool invocations - dynamic routing
                        const toolType = part.type;
                        if (toolType.startsWith('tool-')) {
                          // AI SDK 5.0 uses different property names
                          const toolPart = part as { input?: unknown; args?: unknown };
                          const params = toolPart.input ?? toolPart.args ?? {};
                          return renderToolComponent(toolType, params, i);
                        }

                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 [animation-delay:0.2s]" />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 [animation-delay:0.4s]" />
                    <span className="ml-2 text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-600">Error: {error.message}</p>
        </div>
      )}

      {/* Feedback button - show when there are messages and not loading */}
      {messages.length > 0 && !isLoading && (
        <div className="mt-3">
          <FeedbackButton sessionId={sessionId} />
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your poker situation..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
