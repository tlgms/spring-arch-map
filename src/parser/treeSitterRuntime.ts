import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Parser from 'web-tree-sitter';

export type SupportedLanguage = 'kotlin' | 'java';

const EXTENSION_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.java': 'java',
};

const GRAMMARS_DIR = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..', 'grammars');

export function detectLanguageFromPath(filePath: string): SupportedLanguage | null {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? null;
}

let parserInitPromise: Promise<void> | null = null;

function ensureParserInitialized(): Promise<void> {
  parserInitPromise ??= Parser.init();
  return parserInitPromise;
}

const languageCache = new Map<SupportedLanguage, Promise<Parser.Language>>();

function loadLanguage(language: SupportedLanguage): Promise<Parser.Language> {
  let cached = languageCache.get(language);
  if (!cached) {
    const grammarPath = path.join(GRAMMARS_DIR, `tree-sitter-${language}.wasm`);
    cached = ensureParserInitialized().then(() => Parser.Language.load(grammarPath));
    languageCache.set(language, cached);
  }
  return cached;
}

export async function createParserForFile(filePath: string): Promise<Parser | null> {
  const language = detectLanguageFromPath(filePath);
  if (!language) {
    return null;
  }
  await ensureParserInitialized();
  const loadedLanguage = await loadLanguage(language);
  const parser = new Parser();
  parser.setLanguage(loadedLanguage);
  return parser;
}
