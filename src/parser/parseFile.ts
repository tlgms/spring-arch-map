import { readFile } from 'node:fs/promises';
import { createParserForFile, detectLanguageFromPath, type SupportedLanguage } from './treeSitterRuntime.js';
import { extractKotlinDeclarations, type DeclarationKind } from './kotlinDeclarations.js';
import { extractKotlinImports } from './kotlinImports.js';
import { extractJavaDeclarations } from './javaDeclarations.js';
import { extractJavaImports } from './javaImports.js';

export interface Dependency {
  name: string;
  type: string;
}

export interface DeclarationInfo {
  name: string;
  packageName: string;
  kind: DeclarationKind;
  annotations: string[];
  dependencies: Dependency[];
  extends: string | null;
  implements: string[];
}

export interface ParsedFile {
  filePath: string;
  language: SupportedLanguage;
  imports: string[];
  declarations: DeclarationInfo[];
}

export async function parseFile(filePath: string): Promise<ParsedFile | null> {
  const language = detectLanguageFromPath(filePath);
  if (!language) {
    return null;
  }
  const parser = await createParserForFile(filePath);
  if (!parser) {
    return null;
  }

  const source = await readFile(filePath, 'utf-8');
  const tree = parser.parse(source);

  if (language === 'kotlin') {
    return {
      filePath,
      language,
      imports: extractKotlinImports(tree),
      declarations: extractKotlinDeclarations(tree).map((declaration) => ({
        name: declaration.name,
        packageName: declaration.packageName,
        kind: declaration.kind,
        annotations: declaration.annotations,
        dependencies: declaration.constructorParams,
        extends: declaration.extends,
        implements: declaration.implements,
      })),
    };
  }

  return {
    filePath,
    language,
    imports: extractJavaImports(tree),
    declarations: extractJavaDeclarations(tree).map((declaration) => ({
      name: declaration.name,
      packageName: declaration.packageName,
      kind: declaration.kind,
      annotations: declaration.annotations,
      dependencies: [...declaration.constructorParams, ...declaration.fieldInjections],
      extends: declaration.extends,
      implements: declaration.implements,
    })),
  };
}
