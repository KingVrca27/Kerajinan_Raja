"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Gagal Memuat Data",
  message = "Terjadi kesalahan saat menghubungkan ke server. Silakan periksa koneksi Anda dan coba lagi.",
  onRetry,
  isRetrying = false,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-red-200 bg-red-50/50 backdrop-blur-xs my-4 ${className}`}
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-xs">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="font-heading text-base sm:text-lg font-bold text-red-950 mb-1">
        {title}
      </h3>
      <p className="font-body text-xs sm:text-sm text-red-700 max-w-md leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Memuat..." : "Coba Lagi"}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
