"use client";

import React, { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderActionsProps {
  orderId: string;
}

export default function OrderActions({ orderId }: OrderActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membatalkan pesanan.");
      }
      setIsConfirming(false);
      // Refresh the page data
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col items-end gap-3 border-t border-gray-100 pt-6">
      {errorMsg && (
        <div className="w-full sm:w-auto p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {errorMsg}
        </div>
      )}

      {isConfirming ? (
        <div className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-1">Batalkan Pesanan?</p>
          <p className="text-xs text-gray-500 mb-4">Apakah Anda yakin ingin membatalkan pesanan ini?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsConfirming(false);
                setErrorMsg(null);
              }}
              disabled={isCancelling}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Batalkan Pesanan"
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsConfirming(true)}
          className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-xl transition-colors"
        >
          <XCircle className="h-4 w-4" /> Batalkan Pesanan
        </button>
      )}
    </div>
  );
}
