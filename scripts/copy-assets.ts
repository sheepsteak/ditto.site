import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const source = join(process.cwd(), "src", "compiler", "data");
const destination = join(process.cwd(), "dist", "compiler", "data");

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
