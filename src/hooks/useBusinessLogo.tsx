import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a stored logo path (bucket "logos") into a temporary signed URL.
 * Accepts already-absolute URLs and returns them as-is.
 */
export const useBusinessLogo = (logoPath?: string | null) => {
  const { data } = useQuery({
    queryKey: ["business-logo", logoPath],
    queryFn: async () => {
      if (!logoPath) return null;
      if (/^https?:\/\//i.test(logoPath)) return logoPath;
      const { data, error } = await supabase.storage
        .from("logos")
        .createSignedUrl(logoPath, 60 * 60 * 24 * 7);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
    enabled: !!logoPath,
    staleTime: 1000 * 60 * 60,
  });

  return data ?? null;
};