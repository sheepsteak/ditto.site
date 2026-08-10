import { resolve } from "node:path";
import { CloneService } from "./cloneService.ts";
import { DirectCompilerAdapter } from "./compilerAdapter.ts";
import { LocalCloneInputPolicy } from "./pathPolicy.ts";
import { FileSystemCloneResultInspector } from "./resultInspector.ts";

export type LocalCloneServiceConfig = { inputRoot?: string; outputRoot?: string; defaultOutputDir?: string };
export function createLocalCloneService(config: LocalCloneServiceConfig = {}): CloneService {
  const inputRoot = resolve(config.inputRoot ?? process.cwd());
  const outputRoot = resolve(config.outputRoot ?? process.cwd());
  return new CloneService({
    policy: new LocalCloneInputPolicy({ inputRoot, outputRoot, defaultOutputDir: config.defaultOutputDir }),
    compiler: new DirectCompilerAdapter(),
    inspector: new FileSystemCloneResultInspector(),
  });
}
