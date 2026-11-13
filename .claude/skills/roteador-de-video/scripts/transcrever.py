#!/usr/bin/env python3
"""Transcreve um audio de narracao com o tempo de cada palavra (faster-whisper).

Uso:
  python transcrever.py narracao.mp3 [--saida pasta] [--modelo small] [--idioma pt]

Gera na pasta de saida (padrao: ao lado do audio):
  <nome>.palavras.json  frases com inicio/fim e lista de palavras com inicio/fim (segundos)
  <nome>.srt / .vtt     legendas por frase
  <nome>.txt            texto corrido, para revisar o roteiro

O modelo e baixado do Hugging Face na primeira vez (cache em ~/.cache/huggingface).
Modelos: tiny/base (rapidos, menos precisos), small (padrao, bom para portugues), medium (mais preciso, lento em CPU).
"""
import argparse
import json
import os
import sys


def ts(t, sep):
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s % 1) * 1000)):03d}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--saida")
    ap.add_argument("--modelo", default="small")
    ap.add_argument("--idioma", default="pt")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    base = os.path.splitext(os.path.basename(a.audio))[0]
    out = a.saida or os.path.dirname(os.path.abspath(a.audio))
    os.makedirs(out, exist_ok=True)

    model = WhisperModel(a.modelo, device="cpu", compute_type="int8")
    segs, info = model.transcribe(a.audio, language=a.idioma, word_timestamps=True, vad_filter=True)

    frases = []
    for s in segs:
        palavras = [{"palavra": w.word.strip(), "inicio": round(w.start, 3), "fim": round(w.end, 3)} for w in (s.words or [])]
        frases.append({"inicio": round(s.start, 3), "fim": round(s.end, 3), "texto": s.text.strip(), "palavras": palavras})

    dados = {"audio": os.path.abspath(a.audio), "idioma": info.language, "duracao": round(info.duration, 3), "frases": frases}
    with open(os.path.join(out, base + ".palavras.json"), "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    with open(os.path.join(out, base + ".srt"), "w", encoding="utf-8") as f:
        for i, fr in enumerate(frases, 1):
            f.write(f"{i}\n{ts(fr['inicio'], ',')} --> {ts(fr['fim'], ',')}\n{fr['texto']}\n\n")
    with open(os.path.join(out, base + ".vtt"), "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for fr in frases:
            f.write(f"{ts(fr['inicio'], '.')} --> {ts(fr['fim'], '.')}\n{fr['texto']}\n\n")
    with open(os.path.join(out, base + ".txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(fr["texto"] for fr in frases) + "\n")

    n = sum(len(fr["palavras"]) for fr in frases)
    print(f"{len(frases)} frases, {n} palavras, {dados['duracao']} s -> {out}/{base}.palavras.json (+ .srt .vtt .txt)")


if __name__ == "__main__":
    sys.exit(main())
