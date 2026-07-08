import type Parser from 'web-tree-sitter';

function extractImportPath(importDeclarationNode: Parser.SyntaxNode): string {
  const nameNode = importDeclarationNode.namedChildren.find(
    (child) => child.type === 'scoped_identifier' || child.type === 'identifier',
  );
  const hasWildcard = importDeclarationNode.namedChildren.some((child) => child.type === 'asterisk');
  const path = nameNode?.text ?? '';
  return hasWildcard ? `${path}.*` : path;
}

export function extractJavaImports(tree: Parser.Tree): string[] {
  return tree.rootNode.namedChildren
    .filter((child) => child.type === 'import_declaration')
    .map(extractImportPath);
}
