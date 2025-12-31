import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (if not already configured elsewhere)
if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/**
 * Extract public_id from a Cloudinary URL
 * @example "https://res.cloudinary.com/dhal1mdkg/image/upload/v1234/nexustrade/profiles/abc123.png"
 *          => "nexustrade/profiles/abc123"
 */
export function extractPublicId(url: string): string | null {
    if (!url || !url.includes("cloudinary.com")) {
        return null;
    }

    try {
        // Match pattern: /upload/v{version}/{folder}/{filename}.{ext}
        const match = url.match(/\/upload\/v\d+\/(.+)\.[^.]+$/);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    } catch {
        console.error("Failed to extract public_id from URL:", url);
        return null;
    }
}

/**
 * Delete a single image from Cloudinary
 * @param url - The Cloudinary URL of the image to delete
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteCloudinaryImage(url: string): Promise<boolean> {
    const publicId = extractPublicId(url);
    if (!publicId) {
        console.warn("Could not extract public_id from URL:", url);
        return false;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        const success = result.result === "ok";
        if (success) {
            console.log("Deleted Cloudinary image:", publicId);
        } else {
            console.warn("Cloudinary deletion result:", result);
        }
        return success;
    } catch (error) {
        console.error("Error deleting Cloudinary image:", error);
        return false;
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param urls - Array of Cloudinary URLs to delete
 * @returns Object with counts of successful and failed deletions
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<{
    deleted: number;
    failed: number;
}> {
    let deleted = 0;
    let failed = 0;

    // Filter to only Cloudinary URLs
    const cloudinaryUrls = urls.filter(url => url && url.includes("cloudinary.com"));

    // Delete in parallel with Promise.allSettled
    const results = await Promise.allSettled(
        cloudinaryUrls.map(url => deleteCloudinaryImage(url))
    );

    results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
            deleted++;
        } else {
            failed++;
        }
    });

    console.log(`Cloudinary cleanup: ${deleted} deleted, ${failed} failed`);
    return { deleted, failed };
}
