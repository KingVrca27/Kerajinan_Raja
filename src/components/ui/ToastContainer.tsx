"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useToast, ToastItem } from "@/src/context/ToastContext";

const toastStyles = {
  success: {
    bg: "bg-emerald-900/90 border-emerald-500/40 text-emerald-100 dark:bg-emerald-900/90",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-rose-900/90 border-rose-500/40 text-rose-100 dark:bg-rose-900/90",
    iconBg: "bg-rose-500/20 text-rose-400",
    icon: XCircle,
  },
  warning: {
    bg: "bg-amber-900/90 border-amber-500/40 text-amber-100 dark:bg-amber-900/90",
    iconBg: "bg-amber-500/20 text-amber-400",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-900/90 border-blue-500/40 text-blue-100 dark:bg-blue-900/90",
    iconBg: "bg-blue-500/20 text-blue-400",
    icon: Info,
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast: ToastItem) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all ${style.bg}`}
              role="alert"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${style.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {toast.title && (
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider mb-0.5 opacity-90">
                    {toast.title}
                  </h4>
                )}
                <p className="font-body text-xs font-medium leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
