import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useBusiness = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business", profile?.business_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile!.business_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.business_id,
  });

  return {
    profile,
    business,
    businessId: profile?.business_id ?? null,
    loading: profileLoading || businessLoading,
  };
};
