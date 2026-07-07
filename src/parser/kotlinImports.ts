import type Parser from 'web-tree-sitter';
import { joinIdentifierParts } from './kotlinDeclarations.js';

function extractImportPath(importHeaderNode: Parser.SyntaxNode): string {
  const identifier = importHeaderNode.namedChildren.find((child) => child.type === 'identifier');
  const hasWildcard = importHeaderNode.namedChildren.some((child) => child.type === 'wildcard_import');
  const path = identifier ? joinIdentifierParts(identifier) : '';
  return hasWildcard ? `${path}.*` : path;
}

export function extractKotlinImports(tree: Parser.Tree): string[] {
  const importList = tree.rootNode.namedChildren.find((child) => child.type === 'import_list');
  if (!importList) {
    return [];
  }
  return importList.namedChildren
    .filter((child) => child.type === 'import_header')
    .map(extractImportPath);
}
