"use client";

import React, { useState } from "react";
import { Star, CheckCircle } from "lucide-react";
import ReviewModal from "@/src/components/ui/ReviewModal";
import { useRouter } from "next/navigation";

interface OrderItemActionsProps {
  productId: string;
  orderItemId: string;
  productName: string;
  isReviewed: boolean;
  orderStatus: string;
}

export default function OrderItemActions({
  productId,
  orderItemId,
  productName,
  isReviewed,
  orderStatus,
}: OrderItemActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [reviewedState, setReviewedState] = useState(isReviewed);
  const router = useRouter();

  const handleReviewSubmit = async (rating: number, title: string, content: string, imageFile: File | null) => {
    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("order_item_id", orderItemId);
    formData.append("rating", rating.toString());
    formData.append("title", title);
    formData.append("content", content);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await fetch("/api/reviews", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Gagal mengirim ulasan.");
    }

    setReviewedState(true);
    setSuccessMsg("Terima kasih! Ulasan Anda telah tersimpan.");
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);

    router.refresh();
  };

  if (orderStatus !== "delivered") {
    return null; // Rating button is only available for delivered orders
  }

  return (
    <div className="mt-3 flex items-center justify-end">
      {successMsg && (
        <span className="text-xs text-emerald-600 font-medium mr-3 bg-emerald-50 px-2 py-1 rounded-md">
          {successMsg}
        </span>
      )}
      
      {reviewedState ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg cursor-default">
          <CheckCircle className="h-3.5 w-3.5" /> Sudah Diulas
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#9D734E] bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors"
        >
          <Star className="h-3.5 w-3.5 fill-[#9D734E]" /> Beri Ulasan
        </button>
      )}

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReviewSubmit}
        productName={productName}
      />
    </div>
  );
}
