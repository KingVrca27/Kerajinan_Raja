"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import ReviewModal from "@/src/components/ui/ReviewModal";
import { useRouter } from "next/navigation";

interface ReviewableItem {
  id: string;
  productId: string;
  productName: string;
}

interface OrderCardRatingSectionProps {
  items: ReviewableItem[];
}

export default function OrderCardRatingSection({
  items,
}: OrderCardRatingSectionProps) {
  const router = useRouter();
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  // Track locally reviewed items so UI updates immediately without full page reload
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const openItem = items.find((i) => i.id === modalItemId);
  const pendingItems = items.filter((i) => !reviewedIds.has(i.id));

  const handleReviewSubmit = async (
    rating: number,
    title: string,
    content: string,
    imageFile: File | null
  ) => {
    if (!openItem) return;

    const formData = new FormData();
    formData.append("product_id", openItem.productId);
    formData.append("order_item_id", openItem.id);
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

    // Mark as reviewed locally so button disappears immediately
    setReviewedIds((prev) => new Set([...prev, openItem.id]));
    setModalItemId(null);
    router.refresh();
  };

  if (pendingItems.length === 0) return null;

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "…" : str;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {pendingItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setModalItemId(item.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9D734E] bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors"
          >
            <Star className="h-3 w-3 fill-[#9D734E]" />
            {pendingItems.length === 1
              ? "Beri Ulasan"
              : `Ulas: ${truncate(item.productName, 18)}`}
          </button>
        ))}
      </div>

      {openItem && (
        <ReviewModal
          isOpen={!!modalItemId}
          onClose={() => setModalItemId(null)}
          onSubmit={handleReviewSubmit}
          productName={openItem.productName}
        />
      )}
    </>
  );
}
