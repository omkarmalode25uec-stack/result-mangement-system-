import React from 'react';
import { Inbox, AlertCircle, FileQuestion, RefreshCw } from 'lucide-react';

/**
 * Reusable EmptyState component for responsive layouts and clear status indication.
 * Used when data is unavailable, filtered out, or pending.
 */
export default function EmptyState({
  title = "No Data Available",
  description = "There are no records found for this section or criteria.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  badgeText,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl shadow-xs transition-all">
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-700 mb-4 ring-8 ring-blue-50/50">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      {badgeText && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-2">
          {badgeText}
        </span>
      )}

      <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
