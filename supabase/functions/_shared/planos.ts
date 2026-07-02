// Preços fixos no backend (em BRL). Nunca confie no valor vindo do frontend.
export const PLANOS: Record<string, { nome: string; preco: number }> = {
  basico: { nome: "Básico", preco: 39.0 },
  pro: { nome: "Pro", preco: 89.0 },
  premium: { nome: "Premium", preco: 169.0 },
};

export type PlanoId = keyof typeof PLANOS;

export const isPlanoValido = (p: string): p is PlanoId =>
  Object.prototype.hasOwnProperty.call(PLANOS, p);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};