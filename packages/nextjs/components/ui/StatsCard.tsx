"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard = ({ title, value, subtitle, icon, trend, className = "" }: StatsCardProps) => {
  return (
    <div className={`glass-card p-6 hover:scale-105 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">{icon}</div>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? "text-success" : "text-error"}`}>
            {trend.isPositive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-base-content/80 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-base-content mb-1">{value}</p>
      {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
    </div>
  );
};

export default StatsCard;
