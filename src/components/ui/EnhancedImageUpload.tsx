"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, RefreshCw, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/src/context/ToastContext";

export interface EnhancedImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUploadFile?: (file: File, onProgress: (percent: number) => void) => Promise<string>;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  label?: string;
}

export const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  value,
  onChange,
  onUploadFile,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  label = "Unggah Gambar",
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | undefined>(value);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);

    // Type check
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      const msg = `Format file tidak didukung (${file.type}). Gunakan format JPG, PNG, atau WEBP.`;
      setErrorMessage(msg);
      toastError(msg, "Error Upload");
      return false;
    }

    // Size check
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)}MB) melebihi batas maksimum ${maxSizeMB}MB.`;
      setErrorMessage(msg);
      toastError(msg, "Error Upload");
      return false;
    }

    return true;
  };

  const processUpload = async (file: File) => {
    setSelectedFile(file);

    // Create local blob preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setIsUploading(true);
    setProgress(0);

    try {
      if (onUploadFile) {
        const remoteUrl = await onUploadFile(file, (pct) => setProgress(pct));
        setPreview(remoteUrl);
        onChange(remoteUrl);
      } else {
        // Fallback simulate progress for demo/base state
        for (let i = 0; i <= 100; i += 25) {
          setProgress(i);
          await new Promise((r) => setTimeout(r, 100));
        }
        onChange(localUrl);
      }
      toastSuccess("Upload gambar berhasil!", "Berhasil Upload");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan saat unggah gambar.";
      setErrorMessage(errText);
      toastError(errText, "Error Upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      processUpload(file);
    }
  };

  const handleRetry = () => {
    if (selectedFile && validateFile(selectedFile)) {
      processUpload(selectedFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleCancel = () => {
    setIsUploading(false);
    setProgress(0);
    setPreview(value);
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const handleRemove = () => {
    setPreview(undefined);
    setSelectedFile(null);
    setErrorMessage(null);
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-3">
      {label && (
        <label className="block font-body text-xs font-semibold text-text-primary">
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group rounded-2xl border border-primary/20 bg-secondary/30 overflow-hidden p-3 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden border border-primary/10 bg-white">
            <Image
              src={preview}
              alt="Preview gambar"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 w-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-bold text-text-primary truncate">
                {selectedFile ? selectedFile.name : "Gambar Terpasang"}
              </span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus gambar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar state */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                  <span>Mengunggah...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                >
                  Batal Upload
                </button>
              </div>
            )}

            {!isUploading && !errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Gambar siap digunakan</span>
              </div>
            )}

            {errorMessage && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-2xl bg-white/60 hover:bg-primary/5 transition-all cursor-pointer text-center group"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-heading text-xs font-bold text-text-primary">
            Klik untuk memilih gambar
          </p>
          <p className="font-body text-[11px] text-text-secondary mt-1">
            Format: JPG, PNG, WEBP (Maksimal {maxSizeMB}MB)
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedImageUpload;
