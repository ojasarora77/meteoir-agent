"use client";

import { ReactNode } from "react";

interface TransactionCardProps {
  id: string | number;
  service: string;
  amount: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  icon?: ReactNode;
  details?: string;
  onClick?: () => void;
}

export const TransactionCard = ({
  service,
  amount,
  timestamp,
  status,
  icon,
  details,
  onClick,
}: TransactionCardProps) => {
  const statusColors = {
    completed: "badge-success",
    pending: "badge-warning",
    failed: "badge-error",
  };

  const statusBgColors = {
    completed: "bg-success/10",
    pending: "bg-warning/10",
    failed: "bg-error/10",
  };

  return (
    <div
      className={`flex items-center justify-between p-4 bg-base-100 rounded-xl hover:bg-base-200 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${statusBgColors[status]}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
          {icon || (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base-content truncate">{service}</h3>
          <p className="text-sm text-base-content/60">{timestamp}</p>
          {details && <p className="text-xs text-base-content/50 mt-1">{details}</p>}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-lg text-base-content">{amount}</p>
        <div className={`badge badge-sm ${statusColors[status]}`}>{status}</div>
      </div>
    </div>
  );
};

export default TransactionCard;
