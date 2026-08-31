import { supabase } from "./supabase";

export const MENUFY_MEDIA_BUCKET = "menufy-media";

export async function uploadBusinessImage({
  file,
  businessId,
  folder
}: {
  file: File;
  businessId: string;
  folder: "products" | "branding";
}) {
  const client = supabase;

  if (!client) {
    throw new Error("Supabase não configurado.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = `${businessId}/${folder}/${fileName}`;

  const { error } = await client.storage
    .from(MENUFY_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage
    .from(MENUFY_MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl
  };
}

export async function removeBusinessImage(path: string) {
  const client = supabase;
  if (!client) return;

  const { error } = await client.storage
    .from(MENUFY_MEDIA_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export function extractMenufyStoragePath(publicUrl?: string | null) {
  if (!publicUrl) return null;

  const marker = `/storage/v1/object/public/${MENUFY_MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(publicUrl.slice(index + marker.length));
}
