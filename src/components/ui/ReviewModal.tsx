import React, { useState, useRef } from "react";
import { Star, X, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, title: string, content: string, imageFile: File | null) => Promise<void>;
  productName: string;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, productName }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validasi file gambar
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar.");
      return;
    }
    
    // Validasi ukuran max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar maksimal 5MB.");
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Mohon berikan rating (1-5 bintang).");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit(rating, title, content, imageFile);
      setRating(0);
      setTitle("");
      setContent("");
      removeImage();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-body"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Beri Ulasan Produk</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-1">Produk yang dinilai</p>
              <p className="font-semibold text-gray-900">{productName}</p>
            </div>

            {/* Bintang */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Rating Anda</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Judul Ulasan */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                Judul Ulasan <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kualitas sangat bagus!"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                maxLength={200}
              />
            </div>

            {/* Isi Ulasan */}
            <div className="space-y-1.5">
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700">
                Ceritakan Pengalaman Anda <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bagaimana kualitas, bahan, dan pengirimannya?"
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Foto Review */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Foto Review <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              
              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors"
                >
                  <ImagePlus className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Pilih gambar dari perangkat</span>
                  <span className="text-xs text-gray-400 mt-1">Maks. 5MB (JPG, PNG)</span>
                </button>
              ) : (
                <div className="relative w-full h-40 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                      title="Hapus foto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim Ulasan...
                  </>
                ) : (
                  "Kirim Ulasan"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
