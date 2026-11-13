import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { HandDrawProject } from "@handdraw/core";
import { validateProject } from "@handdraw/core";
import type { PreparedProject } from "./Root.js";
export async function renderProject(project: HandDrawProject, outputLocation: string, assetDirectory: string): Promise<void> {
  const issues = validateProject(project); if (issues.length) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  const prepared = structuredClone(project) as PreparedProject;
  for (const scene of prepared.scenes) for (const object of scene.objects) if (object.kind === "svg" && object.asset) object.assetContent = await readFile(join(assetDirectory, object.asset), "utf8");
  const entryPoint = join(dirname(fileURLToPath(import.meta.url)), "index.js"); const serveUrl = await bundle({ entryPoint });
  // Optional: use a locally installed Chrome/Chromium instead of letting Remotion download one (offline/sandboxed hosts).
  const browserExecutable = process.env.HANDDRAW_BROWSER_EXECUTABLE || null;
  const composition = await selectComposition({ serveUrl, id: "HandDrawAnimation", inputProps: { project: prepared }, browserExecutable });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation, inputProps: { project: prepared }, browserExecutable });
}
