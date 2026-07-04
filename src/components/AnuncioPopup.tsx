import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

const SESSION_KEY = "anuncio_visto_v1";

const AnuncioPopup = () => {
  const { business } = useBusiness();
  const vertical = business?.vertical;
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const { data: anuncio } = useQuery({
    queryKey: ["anuncio-popup", vertical],
    enabled: !!vertical,
    queryFn: async () => {
      const { data } = await supabase
        .from("anuncios")
        .select("*")
        .eq("ativo", true)
        .in("segmento", vertical === "salao" ? ["salao", "ambos"] : ["barbearia", "ambos"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!anuncio) return;
    if (sessionStorage.getItem(SESSION_KEY) === anuncio.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage
        .from("anuncios")
        .createSignedUrl(anuncio.imagem_url, 60 * 60);
      if (!cancelled && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        setOpen(true);
        sessionStorage.setItem(SESSION_KEY, anuncio.id);
      }
    })();
    return () => { cancelled = true; };
  }, [anuncio]);

  if (!anuncio || !signedUrl) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-2 bg-transparent border-0 shadow-none">
        <button
          onClick={() => setOpen(false)}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center z-10"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={signedUrl}
          alt={anuncio.titulo}
          className={`w-full h-auto rounded-lg ${anuncio.link_checkout ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (anuncio.link_checkout) window.open(anuncio.link_checkout, "_blank");
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AnuncioPopup;