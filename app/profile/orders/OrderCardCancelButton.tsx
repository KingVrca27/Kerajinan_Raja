"use client";

import React, { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderCardCancelButtonProps {
  orderId: string;
}

export default function OrderCardCancelButton({ orderId }: OrderCardCancelButtonProps) {
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
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsConfirming(false);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-100 rounded-xl w-full sm:w-auto">
        {errorMsg && (
          <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
        )}
        <p className="text-xs text-gray-700">
          <span className="font-semibold">Batalkan pesanan ini?</span>{" "}
          <span className="text-gray-500">Tindakan ini tidak dapat diurungkan.</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsConfirming(false);
              setErrorMsg(null);
            }}
            disabled={isCancelling}
            className="flex-1 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Memproses...
              </>
            ) : (
              "Ya, Batalkan"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 rounded-lg transition-colors"
    >
      <XCircle className="h-3.5 w-3.5" />
      Batalkan Pesanan
    </button>
  );
}
