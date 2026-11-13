#!/usr/bin/env python3
"""EXEMPLO de video guiado por audio: le a transcricao (transcrever.py) e gera uma pagina javascript-animation
cujos tempos vem das palavras faladas. Uso: python exemplo_audio_para_video.py narracao.palavras.json pagina.html
Adapte as cenas ao novo roteiro; mantenha a regra: cada elemento entra no inicio da palavra que o nomeia."""
import json
import sys
import unicodedata

trans_path, out_path = sys.argv[1], sys.argv[2]
d = json.load(open(trans_path, encoding="utf-8"))


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and unicodedata.category(c) != "Mn")


palavras = [w for fr in d["frases"] for w in fr["palavras"]]


def t(palavra, depois=0.0):
    """inicio da primeira ocorrencia de `palavra` a partir do tempo `depois`"""
    alvo = norm(palavra)
    for w in palavras:
        if w["inicio"] >= depois and norm(w["palavra"]) == alvo:
            return w["inicio"]
    raise SystemExit(f"palavra nao encontrada na transcricao: {palavra!r} (apos {depois}s)")


fr = d["frases"]
T = {
    "dur": round(d["duracao"] + 0.6, 2),
    "ponto": t("ponto"), "equilibrio": t("equilíbrio"),
    "s2": fr[1]["inicio"], "receita": t("receita"), "cobre": t("cobre"), "custos2": t("custos", fr[1]["inicio"]),
    "s3": fr[2]["inicio"], "dez": t("10"), "quarenta": t("40"), "margem": t("margem"),
    "s4": fr[3]["inicio"], "faturar": t("faturar"), "vinteecinco": t("25"), "mes": t("mês"),
    "s5": fr[4]["inicio"], "prejuizo": t("prejuízo"), "acima": t("acima"), "lucro": t("lucro"),
}
print(json.dumps(T, ensure_ascii=False))

html = """<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#f6f3ec}canvas{display:block;width:100vw;height:auto}</style></head>
<body><canvas id="c" width="1920" height="1080"></canvas><script>
const T = __T__;
const W = 1920, H = 1080, FPS = 30;
window.FPS = FPS; window.FRAMES = Math.round(T.dur * FPS);
window.CUES = [T.s2, T.s3, T.s4, T.s5];
const cx = document.getElementById('c').getContext('2d');
const INK = '#1d2433', MUTED = '#6b7280', PAPER = '#f6f3ec', GREEN = '#1f8a5b', RED = '#c2410c', BLUE = '#2f5d8a', GRAY = '#9aa3ae';
const FONT = '"Inter","Noto Sans","DejaVu Sans",sans-serif';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const p = (t, t0, d = .5) => clamp((t - t0) / d);
function text(s, x, y, size, color, weight = 700, align = 'center', alpha = 1) {
  cx.save(); cx.globalAlpha *= alpha; cx.fillStyle = color; cx.font = `${weight} ${size}px ${FONT}`;
  cx.textAlign = align; cx.textBaseline = 'middle'; cx.fillText(s, x, y); cx.restore();
}
function rrect(x, y, w, h, r, fill) { cx.beginPath(); cx.roundRect(x, y, w, h, r); cx.fillStyle = fill; cx.fill(); }
function sceneAlpha(t, a, b) { return Math.min(p(t, a - .15, .35), 1 - p(t, b - .3, .35)); }
function pop(t, t0) { return back(p(t, t0, .45)); }

function draw(frame) {
  const t = frame / FPS;
  cx.globalAlpha = 1; cx.fillStyle = PAPER; cx.fillRect(0, 0, W, H);
  // cabecalho fixo
  text('PONTO DE EQUILÍBRIO', 90, 70, 26, MUTED, 700, 'left', p(t, T.ponto, .6));
  cx.fillStyle = BLUE; cx.fillRect(90, 96, 90 * ease(p(t, T.ponto, .6)), 5);

  // 1. titulo, entra na palavra "ponto"
  let a = sceneAlpha(t, 0, T.s2);
  if (a > 0) { cx.save(); cx.globalAlpha = a;
    const k = pop(t, T.ponto); cx.translate(W / 2, H / 2 - 20); cx.scale(k, k);
    text('Ponto de equilíbrio', 0, 0, 120, INK, 800);
    const u = ease(p(t, T.equilibrio, .7)); cx.fillStyle = BLUE; cx.fillRect(-470, 85, 940 * u, 10);
    cx.restore(); }

  // 2. receita cresce ate cobrir os custos
  a = sceneAlpha(t, T.s2, T.s3);
  if (a > 0) { cx.save(); cx.globalAlpha = a;
    const base = 860, maxH = 520, bw = 260;
    const hc = maxH * ease(p(t, T.s2 + .1, .6));
    rrect(1040, base - hc, bw, hc, 14, GRAY); text('Custos', 1040 + bw / 2, base + 50, 44, INK, 700, 'center', p(t, T.s2 + .2, .4));
    const hr = maxH * ease(p(t, T.receita, T.custos2 - T.receita + .2));
    rrect(620, base - hr, bw, hr, 14, GREEN); text('Receita', 620 + bw / 2, base + 50, 44, INK, 700, 'center', p(t, T.receita, .4));
    const eq = p(t, T.custos2, .4);
    cx.save(); cx.globalAlpha *= eq; cx.setLineDash([18, 14]); cx.strokeStyle = BLUE; cx.lineWidth = 6;
    cx.beginPath(); cx.moveTo(540, base - maxH); cx.lineTo(1380, base - maxH); cx.stroke(); cx.restore();
    text('receita = custos', W / 2, base - maxH - 60, 46, BLUE, 800, 'center', eq);
    cx.fillStyle = INK; cx.fillRect(500, base, 920, 6);
    cx.restore(); }

  // 3. os dois numeros, cada um no instante em que e falado
  a = sceneAlpha(t, T.s3, T.s4);
  if (a > 0) { cx.save(); cx.globalAlpha = a;
    const card = (x, label, value, t0, color) => {
      const k = pop(t, t0); if (k <= 0) return; cx.save(); cx.translate(x, H / 2 + 10); cx.scale(k, k);
      rrect(-330, -190, 660, 380, 28, '#ffffff'); cx.strokeStyle = '#e3ded3'; cx.lineWidth = 3; cx.beginPath(); cx.roundRect(-330, -190, 660, 380, 28); cx.stroke();
      text(label, 0, -100, 44, MUTED, 600); text(value, 0, 40, 132, color, 800); cx.restore(); };
    card(560, 'Custos fixos', 'R$ 10 mil', T.dez, INK);
    card(1360, 'Margem por venda', '40%', T.quarenta, GREEN);
    cx.restore(); }

  // 4. a conta e o resultado, que entra no "25"
  a = sceneAlpha(t, T.s4, T.s5);
  if (a > 0) { cx.save(); cx.globalAlpha = a;
    text('R$ 10.000  ÷  40%', W / 2, 330, 96, INK, 700, 'center', p(t, T.s4, .5));
    const k = pop(t, T.vinteecinco); if (k > 0) { cx.save(); cx.translate(W / 2, 600); cx.scale(k, k);
      rrect(-520, -140, 1040, 280, 32, GREEN); text('R$ 25 mil', 0, 0, 150, '#ffffff', 800); cx.restore(); }
    text('de faturamento por mês', W / 2, 820, 56, INK, 600, 'center', p(t, T.mes, .5));
    cx.restore(); }

  // 5. abaixo prejuizo, acima lucro
  a = sceneAlpha(t, T.s5, T.dur + 1);
  if (a > 0) { cx.save(); cx.globalAlpha = a;
    const x0 = 260, x1 = 1660, y0 = 900, y1 = 220, lineY = 560;
    cx.fillStyle = INK; cx.fillRect(x0, y0, x1 - x0, 6); cx.fillRect(x0, y1, 6, y0 - y1);
    text('Faturamento mensal', (x0 + x1) / 2, y0 + 60, 38, MUTED, 600);
    const lp = ease(p(t, T.s5, .7)); cx.save(); cx.setLineDash([18, 14]); cx.strokeStyle = BLUE; cx.lineWidth = 6;
    cx.beginPath(); cx.moveTo(x0, lineY); cx.lineTo(x0 + (x1 - x0) * lp, lineY); cx.stroke(); cx.restore();
    text('R$ 25 mil', x1 - 10, lineY - 40, 40, BLUE, 800, 'right', lp);
    const pr = ease(p(t, T.prejuizo, .5)); cx.save(); cx.globalAlpha *= .22 * pr; cx.fillStyle = RED; cx.fillRect(x0 + 6, lineY, x1 - x0 - 6, y0 - lineY); cx.restore();
    text('Prejuízo', (x0 + x1) / 2, (lineY + y0) / 2, 88, RED, 800, 'center', pr);
    const lu = ease(p(t, T.lucro, .5)); cx.save(); cx.globalAlpha *= .22 * lu; cx.fillStyle = GREEN; cx.fillRect(x0 + 6, y1, x1 - x0 - 6, lineY - y1); cx.restore();
    text('Lucro', (x0 + x1) / 2, (y1 + lineY) / 2, 88, GREEN, 800, 'center', lu);
    cx.restore(); }
}
window.draw = draw;
if (!location.search.includes('render')) { const t0 = performance.now(); (function loop() { draw(Math.floor((performance.now() - t0) / 1000 * FPS) % FRAMES); requestAnimationFrame(loop); })(); }
</script></body></html>"""

open(out_path, "w", encoding="utf-8").write(html.replace("__T__", json.dumps(T)))
print("pagina ->", out_path)
