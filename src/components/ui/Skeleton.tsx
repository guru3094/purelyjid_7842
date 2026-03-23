import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[#EDE8E0] via-[#F5F0E8] to-[#EDE8E0] bg-[length:200%_100%] rounded-lg ${className}`}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(196,120,90,0.1)]">
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[rgba(196,120,90,0.08)]">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export function AdminStatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
