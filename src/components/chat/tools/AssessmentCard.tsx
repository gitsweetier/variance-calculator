'use client';

import type { ShowAssessmentParams, ToolComponentProps } from '@/lib/ai/types';

const TYPE_STYLES = {
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
  },
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-900',
  },
  insight: {
    container: 'border-purple-200 bg-purple-50',
    icon: 'text-purple-600',
    title: 'text-purple-900',
  },
};

const STATUS_STYLES = {
  good: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  neutral: 'bg-gray-100 text-gray-800',
};

export function AssessmentCard({
  params,
}: ToolComponentProps<ShowAssessmentParams>) {
  const type = params?.type ?? 'info';
  const title = params?.title ?? 'Note';
  const content = params?.content ?? '';
  const flags = params?.flags;

  const styles = TYPE_STYLES[type];

  return (
    <div className={`rounded-lg border p-4 ${styles.container}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${styles.icon}`}>
          {type === 'info' && (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {type === 'warning' && (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {type === 'success' && (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {type === 'insight' && (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className={`font-medium ${styles.title}`}>{title}</h4>
          <p className="mt-1 text-sm text-gray-700">{content}</p>

          {/* Flags */}
          {flags && flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {flags.map((flag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[flag.status]}`}
                >
                  <span className="text-gray-500">{flag.label}:</span>
                  {flag.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
