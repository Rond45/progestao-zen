---
name: roteador-de-video
description: Recognizes a video, animation or illustration request and recommends which of the installed video skills to use, before any work starts. Use FIRST whenever the user asks for a video, animation, explainer, animated clip, motion graphic, logo intro, animated background or illustration and has not named a specific skill - e.g. "quero um vídeo explicando...", "faz uma animação de...", "um vídeo para o Instagram sobre...", "qual skill eu uso para...", "que estilo fica bom para...". Also use when the user asks which video skills exist or what each one does.
---

# Roteador de vídeo

O usuário não precisa lembrar o que cada skill faz. Esta skill lê o pedido, identifica o tipo de peça e recomenda a skill certa, com o porquê, a alternativa, as limitações e o custo, antes de começar. O catálogo ilustrado está em `catalogo-skills-video.pdf`, nesta pasta.

## Como responder

1. Leia o pedido e extraia: **objetivo** (explicar, vender, contar história, ilustrar), **conteúdo** (números, fórmulas, processo, personagem, produto, foto existente), **formato** (16:9 YouTube/apresentação, 9:16 Reels/Stories, 1:1 feed), **duração**, **narração/música**, **texto na tela** e **idioma** (padrão: português do Brasil).
2. Classifique com a tabela abaixo. Na dúvida entre duas, prefira a regra de desempate.
3. Responda com o **cartão de reconhecimento** (formato abaixo) e espere o "ok". Pule a espera só se o usuário disser para executar direto ("pode fazer", "só faz").
4. Pergunte apenas o que muda a escolha e não dá para presumir. Presuma o resto e diga o que presumiu.
5. Depois do "ok", carregue a skill escolhida (e as de apoio) e siga as instruções dela.

### Cartão de reconhecimento

```
Pedido entendido: <uma linha com o que será feito>
Tipo: <categoria da tabela>
Skill recomendada: <nome> - <por que, em uma frase>
Apoio: <skills de apoio, se houver>
Alternativa: <outra skill> - <quando seria melhor>
Formato assumido: <proporção, duração, narração/música, idioma>
Atenção: <limitações, tempo de renderização, custo>
Posso seguir?
```

## Tabela de decisão

| Se o pedido é... | Use | Por quê |
|---|---|---|
| Explicar conceito de negócio ou finanças com **números e gráficos** (juros, faturamento, margem, comparação) | `javascript-animation` + `soundtrack` | Visual editorial limpo de infográfico, trilha sincronizada aos cortes, checagem automática de sincronia. Exemplo pronto de juros compostos. |
| Gráfico financeiro no padrão de jornalismo econômico (eixos, dados, um destaque) | `huashu-art-motion` (gramática `t3_finance_chart`) | Fórmula pronta: eixo, dados, destaque de um número. |
| **Fórmulas, equações, gráficos de função**, raciocínio matemático passo a passo | `manim-composer` → `manimce-best-practices` | Padrão 3Blue1Brown, LaTeX nativo, muito rápido. |
| Explicativo no estilo **Kurzgesagt, Vox**, keynote ou texto animado | `huashu-art-motion` | Tem a gramática de cada um pronta. |
| **Quadro branco** desenhando com narração, simples e didático | `handdraw-skill` | DSL simples, linha + texto escrito, narração por Edge TTS. Para quadro branco mais rico: `huashu-art-motion` (gramática whiteboard) ou `anidoodle` (estilo chalkboard). |
| Vídeo com **estilo artístico** (aquarela, risografia, xilogravura, lápis de cor, pixel art, colagem...), timelapse de desenho, filme com trilha, narração e legendas | `anidoodle` | O mais completo e rápido em CPU: 32 estilos, trilha composta em código, narração, legendas. Padrão quando o estilo importa. |
| Pintores e **épocas da história da arte** (Van Gogh, Monet, Egito, ukiyo-e) ou "viagem pelos estilos" | `huashu-art-motion` | 36 estilos ancorados em obras reais. |
| **Recriar** uma animação de referência que o usuário mostrou | `huashu-art-motion` | Tem fluxo de análise de referência e recriação do mecanismo em código. |
| **Filme de lançamento** de produto/app (ex.: lançar o ProGestão) | `anidoodle` (launch kit) | Formatos 16:9, 1:1, 4:5 e 9:16, telas do produto, trilha e legendas. |
| Curta com **personagem e história**, sem texto, tom de desenho animado | `anidoodle` (personagem consistente) | Rápido. Alternativa: `claude-animation-base` (personagem Clawd, pintura p5.brush), mas é lento sem GPU. |
| **Vinheta de logo**, abertura de marca, splash de app | `logo-animation` | Receitas para web (SVG/Lottie), vídeo e app. Renderizar vídeo com `remotion-video`. |
| **Vários vídeos iguais a partir de uma planilha** (um por cliente, por produto) | `remotion-video` | Vídeo por dados, em lote. |
| **Fundo animado** para site, hero ou atrás de conteúdo | `motion-background` | Gradientes, auroras, partículas, loop perfeito. |
| **Animar uma foto ou imagem existente**, ou visual fotográfico/realista | `motion-collage` | Única com IA generativa. **Paga por uso** (Kairogen ou higgsfield), não reproduzível. Sempre informar custo. |
| **Imagem estática** (ilustração, capa, thumbnail) num estilo artístico | `claude-drawing` | 83 estilos, segundos por imagem, GIF das etapas. Alternativa: `anidoodle` (still). |
| Ilustração **interativa** para site (mascote que reage) ou **aula de desenho** | `anidoodle` | Fluxos próprios para web interativo e lição passo a passo. |
| Trabalho no **Adobe After Effects** | `after-effects` | Expressões, exportação, performance. |

### Regras de desempate

- **Custo:** prefira sempre as skills feitas em código (grátis, reproduzíveis). `motion-collage` só quando o pedido exige imagem/foto real ou o usuário pedir IA generativa.
- **Dados e números exatos:** `javascript-animation` ou `huashu-art-motion` (gráfico financeiro). Fórmulas: `manim`.
- **Estilo visual em primeiro lugar:** `anidoodle`; pintores famosos: `huashu-art-motion`.
- **Rapidez e simplicidade:** `handdraw-skill` (quadro branco) ou `manim`.
- **Sem GPU** (sessão na nuvem): evite `claude-animation-base` com aquarela (cerca de 30 s por quadro).

### Skills de apoio (combine com a principal)

`animation-principles` (ritmo e suavidade), `shot-composition` (enquadramento, margens, formatos), `color-motion` (paleta e cor), `motion-art-direction` (tom e consistência), `beat-sync-editing` (cortes na batida). Cite as que se aplicam no campo "Apoio".

## Narração (voz em português)

O usuário quer vídeos com narração. Padrão: voz neural gratuita do **Edge TTS**, sem chave.

- Vozes pt-BR: `pt-BR-FranciscaNeural` (feminina, padrão), `pt-BR-AntonioNeural` (masculina), `pt-BR-ThalitaMultilingualNeural` (feminina). Pergunte a voz só se o usuário não indicou; senão use Francisca e diga.
- Na nuvem, o host `speech.platform.bing.com` está liberado no ambiente `progestao-zen`, mas o `edge-tts` ignora as variáveis de proxy: passe `--proxy "$HTTPS_PROXY"` sempre que `HTTPS_PROXY` existir. O cliente fica em `.claude/skills/handdraw-skill/.venv/bin/python -m edge_tts` (ou instale com `pip install edge-tts`).
  ```bash
  python -m edge_tts --proxy "$HTTPS_PROXY" --voice pt-BR-FranciscaNeural --text "..." --write-media fala-01.mp3 --write-subtitles fala-01.vtt
  ```
- Como cada skill recebe a voz:
  - `handdraw-skill`: nativo (`audio.narration` no projeto, campo `voice`); o proxy já é passado automaticamente.
  - `anidoodle`: gere os MP3 e use o provedor `files` (gravações próprias) do `tools/narrate.mjs`; ele cuida do tempo e das legendas.
  - `huashu-art-motion`: aceita gravação existente (已有录音) como trilha de voz; gere o MP3 e siga `references/13-口播与语音复刻.md`.
  - `javascript-animation` + `soundtrack`, `manim`, `remotion-video`: gere os MP3 por cena, posicione nos tempos das cenas e misture com a trilha (ffmpeg `adelay` + `amix`, ou `self.add_sound` no Manim). Mantenha a música abaixo da voz (cerca de -18 dB) e rode a checagem de sincronia quando houver.
- Escreva o roteiro da fala primeiro e derive a duração das cenas da duração real dos MP3 (`ffprobe`), não o contrário.
- No cartão de reconhecimento, informe no campo "Formato assumido" a voz e se haverá música por baixo.

## Limitações a avisar

| Skill | Avisar quando relevante |
|---|---|
| `handdraw-skill` | No máximo 8 objetos por cena. Narração nativa (ver seção Narração). |
| `claude-animation-base` | Sem GPU, quadros com aquarela levam cerca de 30 s; prefira pinceladas simples ou renderize na máquina local. Não usa texto na tela. |
| `claude-drawing` | Só imagem estática (e GIF das etapas), não vídeo narrado. |
| `motion-collage` | Custa créditos; confirmar o valor antes de cada geração; conector Kairogen pode estar instável. |
| `manimgl-best-practices` | ManimGL precisa de OpenGL com janela; na nuvem use Manim Community. |
| `huashu-art-motion` | Exemplos têm texto em chinês; o texto do usuário sai em português normalmente. |
| Todas que renderizam com navegador | Na nuvem, use o Chromium já instalado: `export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. |

## Referência rápida: o que existe

| Item | Skills | Em uma frase |
|---|---|---|
| HandDraw | `handdraw-skill` | Quadro branco com traço e texto escrito, narração opcional |
| Claude Animation Base | `claude-animation-base` | Curtas pintados à mão com o personagem Clawd |
| Claude Drawing | `claude-drawing` | Imagens estáticas em 83 estilos artísticos |
| anidoodle | `anidoodle` | Imagens, timelapses e filmes em 32 estilos, com trilha e narração |
| Motion Collage | `motion-collage` | Colagem retrô animada por IA generativa (paga) |
| Motion Design | `animation-principles`, `color-motion`, `shot-composition`, `motion-art-direction`, `beat-sync-editing`, `remotion-video`, `logo-animation`, `motion-background`, `after-effects` | Boas práticas de motion design e receitas de logo, fundo e Remotion |
| Manim | `manim-composer`, `manimce-best-practices`, `manimgl-best-practices` | Animação matemática estilo 3Blue1Brown |
| JavaScript Animation | `javascript-animation`, `soundtrack` | Explicativos em canvas com trilha sincronizada |
| huashu-art-motion | `huashu-art-motion` | 36 estilos de história da arte e 9 gramáticas de explicativo |
