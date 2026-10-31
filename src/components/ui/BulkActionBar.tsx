"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, ToggleLeft, ToggleRight, Trash2, Download, X } from "lucide-react";

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll?: () => void;
  onClearSelection: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onActivate,
  onDeactivate,
  onDelete,
  onExport,
  isLoading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="sticky bottom-4 z-30 mx-auto my-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gray-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md max-w-4xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl font-body text-xs font-semibold">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>{selectedCount} item dipilih</span>
          </div>

          {onSelectAll && selectedCount < totalCount && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs text-primary-light hover:underline cursor-pointer font-medium"
            >
              Pilih semua ({totalCount})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onActivate && (
            <button
              type="button"
              onClick={onActivate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ToggleRight className="h-4 w-4 text-emerald-400" />
              <span>Aktifkan</span>
            </button>
          )}

          {onDeactivate && (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600/30 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-600/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ToggleLeft className="h-4 w-4 text-amber-400" />
              <span>Nonaktifkan</span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/30 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-600/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-blue-400" />
              <span>Export</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 border border-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Batal pilihan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkActionBar;
