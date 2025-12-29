'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FeedbackButtonProps {
  sessionId: string | null;
  onSubmit?: () => void;
}

type Rating = 'helpful' | 'somewhat' | 'not_helpful';

const RATING_OPTIONS: { id: Rating; label: string; emoji: string }[] = [
  { id: 'helpful', label: 'Very helpful', emoji: '👍' },
  { id: 'somewhat', label: 'Somewhat helpful', emoji: '🤔' },
  { id: 'not_helpful', label: 'Not helpful', emoji: '👎' },
];

const ISSUE_OPTIONS = [
  { id: 'wrong_math', label: 'Calculations seemed wrong' },
  { id: 'wrong_questions', label: "Didn't ask the right questions" },
  { id: 'missed_context', label: "Didn't understand my situation" },
  { id: 'too_slow', label: 'Too many questions' },
  { id: 'confusing', label: 'Confusing explanation' },
  { id: 'other', label: 'Other issue' },
];

export function FeedbackButton({ sessionId, onSubmit }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<Rating | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIssueToggle = (issueId: string) => {
    setIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating,
          issues,
          comment: comment.trim() || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      setSubmitted(true);
      onSubmit?.();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapsed state - just show the feedback button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        How did I do?
      </button>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 text-green-800">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Thanks for your feedback!</span>
        </div>
        <p className="mt-1 text-sm text-green-700">
          This helps us improve the variance expert.
        </p>
      </div>
    );
  }

  // Expanded feedback form
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">How did I do?</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Was this conversation helpful?</p>
        <div className="flex gap-2">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setRating(option.id)}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                transition-all duration-150
                ${
                  rating === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Issues (shown if not helpful) */}
      {rating && rating !== 'helpful' && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600">What could be improved? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {ISSUE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleIssueToggle(option.id)}
                className={`
                  rounded-full px-3 py-1 text-xs font-medium
                  transition-all duration-150
                  ${
                    issues.includes(option.id)
                      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment */}
      {rating && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600">
            {rating === 'helpful'
              ? 'Anything else you want to share? (optional)'
              : 'Tell us more about what went wrong (optional)'}
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your feedback helps us improve..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={3}
          />
        </div>
      )}

      {/* Submit */}
      {rating && (
        <div className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      )}
    </div>
  );
}
