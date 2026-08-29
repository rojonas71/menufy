import { supabase } from "./supabase";

export const BRANDING_BUCKET = "menufy-assets";

export type BrandingAssetKind = "logo" | "cover";

const acceptedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml"
]);

function sanitizeBaseName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 50);
}

export function validateBrandingAsset(file: File, kind: BrandingAssetKind) {
  const maxSize = kind === "logo" ? 3 * 1024 * 1024 : 6 * 1024 * 1024;

  if (!acceptedTypes.has(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG, WEBP ou SVG.");
  }

  if (file.size > maxSize) {
    throw new Error(
      kind === "logo"
        ? "A logo deve ter no máximo 3 MB."
        : "A imagem de capa deve ter no máximo 6 MB."
    );
  }
}

export async function uploadBrandingAsset(params: {
  file: File;
  businessId: string;
  userId: string;
  kind: BrandingAssetKind;
}) {
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { file, businessId, userId, kind } = params;
  validateBrandingAsset(file, kind);

  const originalName = file.name.replace(/\.[^/.]+$/, "");
  const safeName = sanitizeBaseName(originalName || kind);
  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  const objectPath = `${userId}/${businessId}/${kind}-${Date.now()}-${safeName}.${extension}`;

  const { error } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(BRANDING_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}
