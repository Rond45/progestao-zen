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
  profissionais: {
    title: "Profissionais",
    description: "Gerencie sua equipe e a agenda de cada profissional.",
    minPlan: "pro",
  },
  financeiro: {
    title: "Financeiro",
    description:
      "Controle seu caixa, receitas e despesas com relatórios completos.",
    minPlan: "pro",
  },
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
  "/dashboard/profissionais": "pro",
  "/dashboard/financeiro": "pro",
  "/dashboard/whatsapp": "pro",
  "/dashboard/produtos": "premium",
  "/dashboard/vendas": "premium",
};