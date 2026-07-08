import type { DeclarationKind, ParsedFile } from '../parser/index.js';

export interface ResolvedDependency {
  name: string;
  rawType: string;
  resolvedFqName: string | null;
}

export interface ResolvedDeclaration {
  fqName: string;
  packageName: string;
  kind: DeclarationKind;
  annotations: string[];
  dependencies: ResolvedDependency[];
  extends: string | null;
  implements: string[];
  filePath: string;
}

function splitTopLevelTypeArgs(argsText: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < argsText.length; i++) {
    const ch = argsText[i];
    if (ch === '<') {
      depth++;
    } else if (ch === '>') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      args.push(argsText.slice(start, i));
      start = i + 1;
    }
  }
  args.push(argsText.slice(start));
  return args.map((arg) => arg.trim());
}

const GENERIC_TYPE_PATTERN = /^([\w.]+)<(.+)>$/;

export function stripToBaseTypeName(rawType: string): string {
  let type = rawType.trim();
  if (type.endsWith('?')) {
    type = type.slice(0, -1).trim();
  }
  const match = GENERIC_TYPE_PATTERN.exec(type);
  const outerType = match?.[1];
  const argsText = match?.[2];
  if (outerType && argsText) {
    const typeArgs = splitTopLevelTypeArgs(argsText);
    if (typeArgs.length === 1 && typeArgs[0]) {
      return stripToBaseTypeName(typeArgs[0]);
    }
    return outerType;
  }
  return type;
}

function simpleNameOf(fqName: string): string {
  const lastDot = fqName.lastIndexOf('.');
  return lastDot === -1 ? fqName : fqName.slice(lastDot + 1);
}

type ClassRegistry = Map<string, string[]>;

function buildClassRegistry(parsedFiles: ParsedFile[]): ClassRegistry {
  const registry: ClassRegistry = new Map();
  for (const file of parsedFiles) {
    for (const declaration of file.declarations) {
      const fqName = declaration.packageName
        ? `${declaration.packageName}.${declaration.name}`
        : declaration.name;
      const existing = registry.get(declaration.name);
      if (existing) {
        existing.push(fqName);
      } else {
        registry.set(declaration.name, [fqName]);
      }
    }
  }
  return registry;
}

function resolveSimpleName(
  simpleName: string,
  packageName: string,
  imports: string[],
  registry: ClassRegistry,
): string | null {
  for (const importPath of imports) {
    if (importPath.endsWith('.*')) {
      continue;
    }
    if (simpleNameOf(importPath) === simpleName) {
      return importPath;
    }
  }

  for (const importPath of imports) {
    if (!importPath.endsWith('.*')) {
      continue;
    }
    const wildcardPackage = importPath.slice(0, -2);
    const candidateFqName = `${wildcardPackage}.${simpleName}`;
    if (registry.get(simpleName)?.includes(candidateFqName)) {
      return candidateFqName;
    }
  }

  const samePackageFqName = packageName ? `${packageName}.${simpleName}` : simpleName;
  if (registry.get(simpleName)?.includes(samePackageFqName)) {
    return samePackageFqName;
  }

  return null;
}

export function resolveTypeReferences(parsedFiles: ParsedFile[]): ResolvedDeclaration[] {
  const registry = buildClassRegistry(parsedFiles);

  const resolved: ResolvedDeclaration[] = [];
  for (const file of parsedFiles) {
    for (const declaration of file.declarations) {
      const fqName = declaration.packageName
        ? `${declaration.packageName}.${declaration.name}`
        : declaration.name;

      resolved.push({
        fqName,
        packageName: declaration.packageName,
        kind: declaration.kind,
        annotations: declaration.annotations,
        extends: declaration.extends,
        implements: declaration.implements,
        filePath: file.filePath,
        dependencies: declaration.dependencies.map((dependency) => {
          const baseTypeName = stripToBaseTypeName(dependency.type);
          const resolvedFqName = resolveSimpleName(
            baseTypeName,
            declaration.packageName,
            file.imports,
            registry,
          );
          return {
            name: dependency.name,
            rawType: dependency.type,
            resolvedFqName,
          };
        }),
      });
    }
  }
  return resolved;
}
