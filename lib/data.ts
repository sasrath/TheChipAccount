import { readFileSync } from "fs";
import { join } from "path";
import { ChipsFileSchema, ProcessesFileSchema, SourcesFileSchema } from "./schemas";
import type { Chip, Process, Source } from "./types";

// ---------------------------------------------------------------------------
// In-process lazy cache. Data is read from disk on first access (or after
// clearDataCache() is called). This lets POST /api/revalidate force a
// reload without restarting the server.
// ---------------------------------------------------------------------------

type ChipsFile = ReturnType<typeof ChipsFileSchema.parse>;
type ProcessesFile = ReturnType<typeof ProcessesFileSchema.parse>;
type SourcesFile = ReturnType<typeof SourcesFileSchema.parse>;

let _chipsFile: ChipsFile | null = null;
let _processesFile: ProcessesFile | null = null;
let _sourcesFile: SourcesFile | null = null;
let _chipsMap: Map<string, Chip> | null = null;
let _processesMap: Map<string, Process> | null = null;
let _sourcesMap: Map<string, Source> | null = null;

const DATA_DIR = join(process.cwd(), "data");

function getChipsFile(): ChipsFile {
  if (!_chipsFile) {
    _chipsFile = ChipsFileSchema.parse(
      JSON.parse(readFileSync(join(DATA_DIR, "chips.json"), "utf-8"))
    );
    _chipsMap = new Map(_chipsFile.chips.map((c) => [c.id, c]));
  }
  return _chipsFile;
}

function getProcessesFile(): ProcessesFile {
  if (!_processesFile) {
    _processesFile = ProcessesFileSchema.parse(
      JSON.parse(readFileSync(join(DATA_DIR, "processes.json"), "utf-8"))
    );
    _processesMap = new Map(_processesFile.processes.map((p) => [p.id, p]));
  }
  return _processesFile;
}

function getSourcesFile(): SourcesFile {
  if (!_sourcesFile) {
    _sourcesFile = SourcesFileSchema.parse(
      JSON.parse(readFileSync(join(DATA_DIR, "sources.json"), "utf-8"))
    );
    _sourcesMap = new Map(_sourcesFile.sources.map((s) => [s.id, s]));
  }
  return _sourcesFile;
}

/**
 * Clears the in-process data cache so the next request re-reads all JSON
 * files from disk. Called by POST /api/revalidate.
 */
export function clearDataCache(): void {
  _chipsFile = null;
  _processesFile = null;
  _sourcesFile = null;
  _chipsMap = null;
  _processesMap = null;
  _sourcesMap = null;
}

// 300 mm wafer; 70 000 mm² usable after edge exclusion (physical constant).
export const WAFER_USABLE_AREA_MM2 = 70_000;
export const SCRIBE_ALLOWANCE_MM2 = 3;

export function listChips(): Chip[] {
  return getChipsFile().chips;
}

export function getChip(id: string): Chip | undefined {
  getChipsFile(); // ensure map is populated
  return _chipsMap!.get(id);
}

export function getProcess(id: string): Process | undefined {
  getProcessesFile(); // ensure map is populated
  return _processesMap!.get(id);
}

export function listProcesses(): Process[] {
  return getProcessesFile().processes;
}

export function getSource(id: string): Source | undefined {
  getSourcesFile(); // ensure map is populated
  return _sourcesMap!.get(id);
}

export function listSources(): Source[] {
  return getSourcesFile().sources;
}
