'use client';

/**
 * @fileoverview Shared ProgressIndicator Component - Visual progress display for upload operations
 * @module @/mobile/components/shared/Progress/ProgressIndicator
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { ProgressIndicatorProps } from './Progress.types';

/**
 * ProgressIndicator Component - Visual progress display for upload operations
 *
 * Features:
 * - Linear and circular progress variants
 * - Smooth animations with reduced motion support
 * - Accessible with ARIA labels and live regions
 * - Color-coded progress states (primary, success, error)
 * - Optional percentage display
 * - Responsive design
 * - High contrast mode support
 *
 * @param props ProgressIndicatorProps
 * @returns JSX.Element
 *
 * @example
 * ```tsx
 * // Linear progress bar
 * <ProgressIndicator
 *   progress={75}
 *   variant="linear"
 *   color="primary"
 *   showPercentage={true}
 * />
 *
 * // Circular progress indicator
 * <ProgressIndicator
 *   progress={45}
 *   variant="circular"
 *   color="success"
 *   showPercentage={true}
 * />
 * ```
 */
export const ProgressIndicator = React.memo<ProgressIndicatorProps>(function ProgressIndicator({
  progress,
  showPercentage = true,
  variant = 'linear',
  color = 'primary',
  className = '',
  testId = 'progress-indicator'
}) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, displayProgress));
  const percentage = Math.round(clampedProgress);

  // Determine color classes and values
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'progress-indicator--success';
      case 'error':
        return 'progress-indicator--error';
      case 'secondary':
        return 'progress-indicator--secondary';
      default:
        return 'progress-indicator--primary';
    }
  };

  const containerClasses = `
    progress-indicator
    progress-indicator--${variant}
    ${getColorClasses()}
    ${className}
  `.trim();

  if (variant === 'circular') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

    return (
      <div
        className={containerClasses}
        data-testid={testId}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${percentage}%`}
      >
        <svg
          className="progress-indicator__circular-svg"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            className="progress-indicator__circular-bg"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className="progress-indicator__circular-progress"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>

        {showPercentage && (
          <div className="progress-indicator__circular-text">
            <span className="progress-indicator__percentage">
              {percentage}
            </span>
            <span className="progress-indicator__percent-sign">%</span>
          </div>
        )}

        <style jsx>{`
          .progress-indicator--circular {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
          }

          .progress-indicator__circular-svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }

          .progress-indicator__circular-bg {
            stroke: #e2e8f0;
            opacity: 0.3;
          }

          .progress-indicator__circular-progress {
            transition: stroke-dashoffset 0.5s ease-in-out;
          }

          .progress-indicator--primary .progress-indicator__circular-progress {
            stroke: #3b82f6;
          }

          .progress-indicator--secondary .progress-indicator__circular-progress {
            stroke: #6b7280;
          }

          .progress-indicator--success .progress-indicator__circular-progress {
            stroke: #10b981;
          }

          .progress-indicator--error .progress-indicator__circular-progress {
            stroke: #ef4444;
          }

          .progress-indicator__circular-text {
            position: absolute;
            display: flex;
            align-items: baseline;
            justify-content: center;
            font-weight: 600;
            color: #374151;
          }

          .progress-indicator__percentage {
            font-size: 18px;
            line-height: 1;
          }

          .progress-indicator__percent-sign {
            font-size: 12px;
            margin-left: 1px;
            opacity: 0.8;
          }

          @media (prefers-reduced-motion: reduce) {
            .progress-indicator__circular-progress {
              transition: none;
            }
          }
        `}</style>
      </div>
    );
  }

  // Linear variant
  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Upload progress: ${percentage}%`}
    >
      <div className="progress-indicator__track">
        <div
          className="progress-indicator__fill"
          style={{
            width: `${clampedProgress}%`,
            transition: 'width 0.5s ease-in-out'
          }}
        />
      </div>

      {showPercentage && (
        <div className="progress-indicator__text">
          <span
            className="progress-indicator__percentage"
            aria-live="polite"
            aria-atomic="true"
          >
            {percentage}%
          </span>
        </div>
      )}

      <style jsx>{`
        .progress-indicator--linear {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .progress-indicator__track {
          position: relative;
          width: 100%;
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .progress-indicator__fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
          background: linear-gradient(90deg, currentColor, currentColor);
          transition: width 0.5s ease-in-out;
        }

        .progress-indicator__fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        .progress-indicator--primary .progress-indicator__fill {
          color: #3b82f6;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
        }

        .progress-indicator--secondary .progress-indicator__fill {
          color: #6b7280;
          background: linear-gradient(90deg, #6b7280, #4b5563);
        }

        .progress-indicator--success .progress-indicator__fill {
          color: #10b981;
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .progress-indicator--error .progress-indicator__fill {
          color: #ef4444;
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .progress-indicator__text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .progress-indicator__percentage {
          font-weight: 600;
          color: #374151;
          min-width: 35px;
          text-align: right;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .progress-indicator__track {
            height: 6px;
          }

          .progress-indicator__text {
            font-size: 13px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .progress-indicator__fill {
            transition: none;
          }

          .progress-indicator__fill::after {
            animation: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .progress-indicator__track {
            border: 1px solid currentColor;
            background-color: transparent;
          }

          .progress-indicator__fill {
            background: currentColor !important;
          }

          .progress-indicator--primary .progress-indicator__fill {
            color: #000;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .progress-indicator__track {
            background-color: #374151;
          }

          .progress-indicator__percentage {
            color: #f3f4f6;
          }
        }
      `}</style>
    </div>
  );
});

ProgressIndicator.displayName = 'ProgressIndicator';