"use client";

import { ReactNode } from "react";

interface ServiceCardProps {
  name: string;
  status: "active" | "paused" | "error" | "connecting";
  pricing: string;
  usage?: string;
  uptime?: string;
  icon?: ReactNode;
  onToggle?: () => void;
  onConfigure?: () => void;
}

export const ServiceCard = ({
  name,
  status,
  pricing,
  usage,
  uptime,
  icon,
  onToggle,
  onConfigure,
}: ServiceCardProps) => {
  const statusConfig = {
    active: {
      badge: "badge-success",
      dot: "bg-success",
      text: "Active",
    },
    paused: {
      badge: "badge-warning",
      dot: "bg-warning",
      text: "Paused",
    },
    error: {
      badge: "badge-error",
      dot: "bg-error",
      text: "Error",
    },
    connecting: {
      badge: "badge-info",
      dot: "bg-info animate-pulse",
      text: "Connecting",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="glass-card p-5 hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-base-content truncate">{name}</h3>
            <p className="text-sm text-base-content/60">{pricing}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
          <div className={`badge badge-sm ${config.badge}`}>{config.text}</div>
        </div>
      </div>

      {(usage || uptime) && (
        <div className="space-y-2 mb-4">
          {usage && (
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Usage:</span>
              <span className="font-medium">{usage}</span>
            </div>
          )}
          {uptime && (
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Uptime:</span>
              <span className="font-medium text-success">{uptime}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {onToggle && (
          <button
            className={`btn btn-sm flex-1 ${status === "active" ? "btn-warning" : "btn-success"}`}
            onClick={onToggle}
          >
            {status === "active" ? "Pause" : "Activate"}
          </button>
        )}
        {onConfigure && (
          <button className="btn btn-outline btn-sm" onClick={onConfigure}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
