import type Parser from 'web-tree-sitter';

export type DeclarationKind = 'class' | 'interface' | 'enum';

export interface ConstructorParam {
  name: string;
  type: string;
}

export interface KotlinDeclaration {
  name: string;
  packageName: string;
  kind: DeclarationKind;
  annotations: string[];
  constructorParams: ConstructorParam[];
  extends: string | null;
  implements: string[];
}

export function joinIdentifierParts(identifierNode: Parser.SyntaxNode): string {
  return identifierNode.namedChildren
    .filter((child) => child.type === 'simple_identifier')
    .map((child) => child.text)
    .join('.');
}

function extractPackageName(rootNode: Parser.SyntaxNode): string {
  const packageHeader = rootNode.namedChildren.find((child) => child.type === 'package_header');
  if (!packageHeader) {
    return '';
  }
  const identifier = packageHeader.namedChildren.find((child) => child.type === 'identifier');
  return identifier ? joinIdentifierParts(identifier) : '';
}

function extractDeclarationKind(classDeclarationNode: Parser.SyntaxNode): DeclarationKind {
  for (let i = 0; i < classDeclarationNode.childCount; i++) {
    const child = classDeclarationNode.child(i);
    if (child?.type === 'interface') {
      return 'interface';
    }
    if (child?.type === 'enum') {
      return 'enum';
    }
  }
  return 'class';
}

function extractDeclarationName(classDeclarationNode: Parser.SyntaxNode): string {
  const nameNode = classDeclarationNode.namedChildren.find((child) => child.type === 'type_identifier');
  return nameNode?.text ?? '';
}

function extractAnnotations(classDeclarationNode: Parser.SyntaxNode): string[] {
  const modifiers = classDeclarationNode.namedChildren.find((child) => child.type === 'modifiers');
  if (!modifiers) {
    return [];
  }
  const annotations: string[] = [];
  for (const modifierChild of modifiers.namedChildren) {
    if (modifierChild.type !== 'annotation') {
      continue;
    }
    const typeIdentifier = modifierChild.descendantsOfType('type_identifier')[0];
    if (typeIdentifier) {
      annotations.push(typeIdentifier.text);
    }
  }
  return annotations;
}

function extractConstructorParams(classDeclarationNode: Parser.SyntaxNode): ConstructorParam[] {
  const primaryConstructor = classDeclarationNode.namedChildren.find(
    (child) => child.type === 'primary_constructor',
  );
  if (!primaryConstructor) {
    return [];
  }

  const params: ConstructorParam[] = [];
  for (const paramNode of primaryConstructor.namedChildren) {
    if (paramNode.type !== 'class_parameter') {
      continue;
    }
    const named = paramNode.namedChildren;
    const nameIndex = named.findIndex((child) => child.type === 'simple_identifier');
    const nameNode = named[nameIndex];
    const typeNode = named[nameIndex + 1];
    if (!nameNode || !typeNode) {
      continue;
    }
    params.push({ name: nameNode.text, type: typeNode.text });
  }
  return params;
}

interface Delegations {
  extends: string | null;
  implements: string[];
}

function extractDelegations(classDeclarationNode: Parser.SyntaxNode): Delegations {
  let extendsClass: string | null = null;
  const implementsInterfaces: string[] = [];

  for (const child of classDeclarationNode.namedChildren) {
    if (child.type !== 'delegation_specifier') {
      continue;
    }
    const specifier = child.namedChild(0);
    const typeIdentifier = specifier?.descendantsOfType('type_identifier')[0];
    if (!typeIdentifier) {
      continue;
    }
    if (specifier.type === 'constructor_invocation') {
      extendsClass = typeIdentifier.text;
    } else {
      implementsInterfaces.push(typeIdentifier.text);
    }
  }

  return { extends: extendsClass, implements: implementsInterfaces };
}

export function extractKotlinDeclarations(tree: Parser.Tree): KotlinDeclaration[] {
  const rootNode = tree.rootNode;
  const packageName = extractPackageName(rootNode);

  const declarations: KotlinDeclaration[] = [];
  for (const child of rootNode.namedChildren) {
    if (child.type !== 'class_declaration') {
      continue;
    }
    declarations.push({
      name: extractDeclarationName(child),
      packageName,
      kind: extractDeclarationKind(child),
      annotations: extractAnnotations(child),
      constructorParams: extractConstructorParams(child),
      ...extractDelegations(child),
    });
  }
  return declarations;
}
