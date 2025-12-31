"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Upload, X, ImageIcon } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface ImageUploadProps {
    /**
     * Upload mode:
     * - "single": For profile images (1 image max)
     * - "multiple": For listings (up to 3 images)
     */
    mode: "single" | "multiple";

    /**
     * Cloudinary folder path for organizing uploads
     * @example "nexustrade/listings" or "nexustrade/profiles"
     */
    folder?: string;

    /**
     * Callback when upload completes
     * - single mode: returns string (secure_url)
     * - multiple mode: returns string[] (array of secure_urls)
     */
    onUploadComplete: (urls: string | string[]) => void;

    /**
     * Optional: Pre-existing images (for edit forms)
     */
    existingImages?: string[];

    /**
     * Optional: Button label
     */
    buttonLabel?: string;

    /**
     * Optional: Custom button className
     */
    buttonClassName?: string;
}

interface CloudinaryResultInfo {
    secure_url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
}

export default function ImageUpload({
    mode,
    folder = "nexustrade/uploads",
    onUploadComplete,
    existingImages = [],
    buttonLabel,
    buttonClassName,
}: ImageUploadProps) {
    const [uploadedImages, setUploadedImages] = useState<string[]>(existingImages);
    const [isLoading, setIsLoading] = useState(false);
    const isInitialMount = useRef(true);

    const maxImages = mode === "single" ? 1 : 3;
    const remainingSlots = maxImages - uploadedImages.length;
    const canUpload = remainingSlots > 0;

    const defaultLabel = mode === "single"
        ? "Upload Image"
        : `Upload Images (${uploadedImages.length}/${maxImages})`;

    // Notify parent when uploaded images change (after initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Use setTimeout to defer callback and avoid setState-during-render
        const timer = setTimeout(() => {
            if (mode === "single") {
                onUploadComplete(uploadedImages[0] || "");
            } else {
                onUploadComplete(uploadedImages);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [uploadedImages, mode, onUploadComplete]);

    const handleUploadSuccess = useCallback(
        (result: CloudinaryUploadWidgetResults) => {
            if (result.info && typeof result.info !== "string") {
                const info = result.info as CloudinaryResultInfo;
                const newUrl = info.secure_url;

                setUploadedImages((prev) => {
                    const updated = [...prev, newUrl].slice(0, maxImages);
                    return updated;
                });
            }
            setIsLoading(false);
        },
        [maxImages]
    );

    const removeImage = useCallback(
        (indexToRemove: number) => {
            setUploadedImages((prev) => {
                const updated = prev.filter((_, index) => index !== indexToRemove);
                return updated;
            });
        },
        []
    );

    return (
        <div className="space-y-4">
            {/* Image Preview Grid */}
            {uploadedImages.length > 0 && (
                <div className={`grid gap-3 ${mode === "single" ? "grid-cols-1" : "grid-cols-3"}`}>
                    {uploadedImages.map((url, index) => (
                        <div
                            key={url}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700"
                        >
                            <img
                                src={url}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {/* Empty slots for multiple mode */}
                    {mode === "multiple" &&
                        Array.from({ length: remainingSlots }).map((_, index) => (
                            <div
                                key={`empty-${index}`}
                                className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center"
                            >
                                <ImageIcon className="w-8 h-8 text-zinc-600" />
                            </div>
                        ))}
                </div>
            )}

            {/* Upload Button */}
            {canUpload && (
                <CldUploadWidget
                    signatureEndpoint="/api/sign-cloudinary-params"
                    options={{
                        folder,
                        maxFiles: mode === "single" ? 1 : remainingSlots,
                        maxFileSize: 10000000, // 10MB limit
                        clientAllowedFormats: ["png", "jpeg", "webp"],
                        sources: ["local", "url", "camera"],
                        multiple: mode === "multiple",
                        resourceType: "image",
                        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
                    }}
                    onSuccess={handleUploadSuccess}
                    onOpen={() => setIsLoading(true)}
                    onClose={() => setIsLoading(false)}
                >
                    {({ open }) => (
                        <button
                            type="button"
                            onClick={() => open()}
                            disabled={isLoading || !canUpload}
                            className={
                                buttonClassName ||
                                "flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                            }
                        >
                            <Upload className="w-5 h-5" />
                            {isLoading ? "Uploading..." : buttonLabel || defaultLabel}
                        </button>
                    )}
                </CldUploadWidget>
            )}

            {/* Max images reached message */}
            {!canUpload && (
                <p className="text-sm text-zinc-400 text-center">
                    Maximum {maxImages} image{maxImages > 1 ? "s" : ""} uploaded
                </p>
            )}
        </div>
    );
}
