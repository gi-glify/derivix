import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-brand-line dark:bg-brand-line/30 rounded-md ${className}`} 
    />
  );
}
