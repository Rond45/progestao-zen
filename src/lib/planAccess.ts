export type PlanName = "basico" | "pro" | "premium";

export const PLAN_LEVEL: Record<PlanName, number> = {
  basico: 1,
  pro: 2,
  premium: 3,
};

export const PLAN_LABEL: Record<PlanName, string> = {
  basico: "Básico",
  pro: "Pro",
  premium: "Premium",
};

export const FEATURE_COPY: Record<
  string,
  { title: string; description: string; minPlan: PlanName }
> = {
  whatsapp: {
    title: "WhatsApp IA",
    description:
      "Atenda e agende pelo WhatsApp automaticamente, com inteligência artificial.",
    minPlan: "pro",
  },
  produtos: {
    title: "Produtos",
    description: "Controle o estoque de produtos do seu estabelecimento.",
    minPlan: "premium",
  },
  vendas: {
    title: "Vendas e Consumo",
    description: "Registre vendas de produtos e o consumo dos clientes.",
    minPlan: "premium",
  },
};

export const ROUTE_MIN_PLAN: Record<string, PlanName> = {
  "/dashboard/whatsapp": "pro",
  "/dashboard/produtos": "premium",
  "/dashboard/vendas": "premium",
};

export const PROFESSIONAL_LIMITS: Record<PlanName, number> = {
  basico: 2,
  pro: 4,
  premium: 9999,
};

export const NEXT_PLAN: Record<PlanName, PlanName> = {
  basico: "pro",
  pro: "premium",
  premium: "premium",
};