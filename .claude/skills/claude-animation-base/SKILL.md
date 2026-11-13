---
name: claude-animation-base
description: Make short hand-painted 2D cartoon animations (MP4) of Clawd or any custom character with p5.js + p5.brush, rendered headless in Chrome. Use when the user asks for an animated cartoon, character animation, animated short, brush/watercolour-style video, or a Clawd animation.
---

# Claude Animation Base

A character-animation kit (p5.js + p5.brush) with a strict guide for making short, hand-painted cartoons. Source: https://github.com/JohnHeibel/ClaudeAnimationBase (MIT).

`<skill>` below means this skill's directory (the folder that contains this file).

## Workflow

1. **Read `<skill>/ANIMATION_GUIDE.md` in full before drawing anything.** It holds the rules (handmade, alive, one piece, no text, timing), the storyboard workflow and the full API. Look at `<skill>/docs/emotions.jpg` and `<skill>/docs/views.jpg`.
2. **Never edit the kit in this skill folder.** For each video, make a working copy inside the user's project (default `animations/<short-name>/`, unless the user names another place):
   ```bash
   W=animations/<short-name>; mkdir -p "$W"
   tar -C <skill> --exclude=node_modules --exclude=out --exclude=SKILL.md -cf - . | tar -C "$W" -xf -
   ln -s <skill>/node_modules "$W/node_modules"   # reuse installed deps
   ```
   If `<skill>/node_modules` is missing, run `npm ci` in `<skill>` first. Add `animations/*/node_modules` and `animations/*/out/` to the project's `.gitignore` if the user will commit the work.
3. Work only inside the copy, running every command from it: set `duration`/`bpm` in `src/config.js`, write the scene in `src/scenes/<name>.js`, and replace the `demo.js` script tag in `studio.html` with it. Storyboard first, as the guide says.
4. Check your work with contact sheets, strips and crops (`node render.mjs --sheet=...`, `--strip=...`) before rendering the full video, then `node render.mjs --clip --out=out/video.mp4`.

## Environment notes

- Needs Node.js, ffmpeg and Chrome/Chromium. If `render.mjs` says "Chrome not found", pass `--chrome=<path>` or set `CHROME_PATH` (e.g. `/opt/pw-browsers/chromium` on hosts with a pre-installed Playwright Chromium).
- **No GPU** (cloud containers, CI): add `--soft-gl`. p5.brush watercolour `fill`s then cost ~30 s per frame, so a 10 s video takes hours. On such machines, tell the user, and unless they want the watercolour look anyway, replace watercolour fills with cheaper brush/wash treatments and check with contact sheets of a few frames.
- `node gpu_probe.mjs <chrome path>` shows which GPU renderer Chrome gets.
