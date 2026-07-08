import type Parser from 'web-tree-sitter';
import type { ConstructorParam, DeclarationKind } from './kotlinDeclarations.js';

export interface JavaDeclaration {
  name: string;
  packageName: string;
  kind: DeclarationKind;
  annotations: string[];
  constructorParams: ConstructorParam[];
  fieldInjections: ConstructorParam[];
  extends: string | null;
  implements: string[];
}

const DECLARATION_NODE_TYPES: Record<string, DeclarationKind> = {
  class_declaration: 'class',
  interface_declaration: 'interface',
  enum_declaration: 'enum',
};

function extractPackageName(rootNode: Parser.SyntaxNode): string {
  const packageDeclaration = rootNode.namedChildren.find((child) => child.type === 'package_declaration');
  if (!packageDeclaration) {
    return '';
  }
  const nameNode = packageDeclaration.namedChildren.find(
    (child) => child.type === 'scoped_identifier' || child.type === 'identifier',
  );
  return nameNode?.text ?? '';
}

function extractDeclarationName(declarationNode: Parser.SyntaxNode): string {
  const nameNode = declarationNode.namedChildren.find((child) => child.type === 'identifier');
  return nameNode?.text ?? '';
}

function extractAnnotations(nodeWithModifiers: Parser.SyntaxNode): string[] {
  const modifiers = nodeWithModifiers.namedChildren.find((child) => child.type === 'modifiers');
  if (!modifiers) {
    return [];
  }
  const annotations: string[] = [];
  for (const modifierChild of modifiers.namedChildren) {
    if (modifierChild.type !== 'marker_annotation' && modifierChild.type !== 'annotation') {
      continue;
    }
    const identifier = modifierChild.namedChildren.find((child) => child.type === 'identifier');
    if (identifier) {
      annotations.push(identifier.text);
    }
  }
  return annotations;
}

function findClassBody(declarationNode: Parser.SyntaxNode): Parser.SyntaxNode | undefined {
  return declarationNode.namedChildren.find(
    (child) => child.type === 'class_body' || child.type === 'interface_body' || child.type === 'enum_body',
  );
}

function extractConstructorParams(declarationNode: Parser.SyntaxNode): ConstructorParam[] {
  const body = findClassBody(declarationNode);
  const constructor = body?.namedChildren.find((child) => child.type === 'constructor_declaration');
  const formalParameters = constructor?.namedChildren.find((child) => child.type === 'formal_parameters');
  if (!formalParameters) {
    return [];
  }

  const params: ConstructorParam[] = [];
  for (const param of formalParameters.namedChildren) {
    if (param.type !== 'formal_parameter') {
      continue;
    }
    const named = param.namedChildren;
    const nameNode = named[named.length - 1];
    const typeNode = named[named.length - 2];
    if (!nameNode || !typeNode) {
      continue;
    }
    params.push({ name: nameNode.text, type: typeNode.text });
  }
  return params;
}

function extractFieldInjections(declarationNode: Parser.SyntaxNode): ConstructorParam[] {
  const body = findClassBody(declarationNode);
  if (!body) {
    return [];
  }

  const fields: ConstructorParam[] = [];
  for (const member of body.namedChildren) {
    if (member.type !== 'field_declaration') {
      continue;
    }
    if (!extractAnnotations(member).includes('Autowired')) {
      continue;
    }
    const typeNode = member.namedChildren.find(
      (child) => child.type !== 'modifiers' && child.type !== 'variable_declarator',
    );
    if (!typeNode) {
      continue;
    }
    for (const declarator of member.namedChildren) {
      if (declarator.type !== 'variable_declarator') {
        continue;
      }
      const nameNode = declarator.namedChild(0);
      if (nameNode) {
        fields.push({ name: nameNode.text, type: typeNode.text });
      }
    }
  }
  return fields;
}

function extractSuperclass(declarationNode: Parser.SyntaxNode): string | null {
  const superclass = declarationNode.namedChildren.find((child) => child.type === 'superclass');
  const typeIdentifier = superclass?.descendantsOfType('type_identifier')[0];
  return typeIdentifier?.text ?? null;
}

function extractInterfaces(declarationNode: Parser.SyntaxNode): string[] {
  const container = declarationNode.namedChildren.find(
    (child) => child.type === 'super_interfaces' || child.type === 'extends_interfaces',
  );
  const typeList = container?.namedChildren.find((child) => child.type === 'type_list');
  if (!typeList) {
    return [];
  }
  return typeList.namedChildren
    .map((child) => child.descendantsOfType('type_identifier')[0])
    .filter((node): node is Parser.SyntaxNode => node !== undefined)
    .map((node) => node.text);
}

export function extractJavaDeclarations(tree: Parser.Tree): JavaDeclaration[] {
  const rootNode = tree.rootNode;
  const packageName = extractPackageName(rootNode);

  const declarations: JavaDeclaration[] = [];
  for (const child of rootNode.namedChildren) {
    const kind = DECLARATION_NODE_TYPES[child.type];
    if (!kind) {
      continue;
    }
    declarations.push({
      name: extractDeclarationName(child),
      packageName,
      kind,
      annotations: extractAnnotations(child),
      constructorParams: extractConstructorParams(child),
      fieldInjections: extractFieldInjections(child),
      extends: extractSuperclass(child),
      implements: extractInterfaces(child),
    });
  }
  return declarations;
}
