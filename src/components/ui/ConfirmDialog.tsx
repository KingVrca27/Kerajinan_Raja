"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, X, RefreshCw, LogOut } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const variantIcons = {
  danger: Trash2,
  warning: AlertTriangle,
  info: ShieldAlert,
  success: CheckCircle2,
};

const variantStyles = {
  danger: {
    iconBg: "bg-red-100 text-red-600",
    buttonBg: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  },
  warning: {
    iconBg: "bg-amber-100 text-amber-600",
    buttonBg: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
  },
  info: {
    iconBg: "bg-blue-100 text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
  },
  success: {
    iconBg: "bg-emerald-100 text-emerald-600",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const style = variantStyles[variant];
  const IconComponent = variantIcons[variant];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isLoading && onClose()}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl z-10 border border-primary/10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:bg-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${style.iconBg}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3
                id="confirm-dialog-title"
                className="font-heading text-lg font-bold text-text-primary mb-1"
              >
                {title}
              </h3>
              <p
                id="confirm-dialog-description"
                className="font-body text-xs text-text-secondary leading-relaxed"
              >
                {description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-primary/20 font-body text-xs font-semibold text-text-secondary hover:bg-secondary hover:text-text-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-body text-xs font-semibold shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center gap-2 ${style.buttonBg}`}
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
