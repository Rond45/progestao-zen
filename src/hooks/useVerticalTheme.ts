import { useEffect, useMemo } from "react";

// "vertical" = qual ambiente o usuário escolheu: "barbearia" ou "salao".
// A gente usa isso para manter as cores/tema consistentes em todas as páginas.

export type Vertical = "barbearia" | "salao";

const STORAGE_KEY = "progestao_vertical";

export function getStoredVertical(): Vertical | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "barbearia" || v === "salao" ? v : null;
  } catch {
    return null;
  }
}

export function storeVertical(vertical: Vertical) {
  try {
    localStorage.setItem(STORAGE_KEY, vertical);
  } catch {
    // ignore
  }
}

export function applyVerticalTheme(vertical: Vertical | null) {
  // A classe "salon-theme" existe no CSS e muda as variáveis de cor.
  // Quando não é salão, deixamos sem essa classe (tema padrão = barbearia).
  const root = document.documentElement;
  if (!root) return;

  if (vertical === "salao") root.classList.add("salon-theme");
  else root.classList.remove("salon-theme");
}

/**
 * Mantém o tema sincronizado com o localStorage.
 * Use em páginas que precisam respeitar a vertical escolhida.
 */
export function useVerticalTheme(vertical?: Vertical | null) {
  const stored = useMemo(() => getStoredVertical(), []);
  const effective = vertical ?? stored;

  useEffect(() => {
    applyVerticalTheme(effective ?? null);
  }, [effective]);

  useEffect(() => {
    // Se foi passado um vertical explícito, persistimos.
    if (vertical === "barbearia" || vertical === "salao") storeVertical(vertical);
  }, [vertical]);

  return { vertical: effective, storedVertical: stored };
}
