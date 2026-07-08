const ANNOTATION_STEREOTYPES = ['RestController', 'Service', 'Repository', 'Component', 'Configuration'];

const PACKAGE_CONVENTION_STEREOTYPES: Record<string, string> = {
  port: 'Port',
  adapter: 'Adapter',
  domain: 'Domain',
  usecase: 'UseCase',
};

export interface StereotypeInput {
  annotations: string[];
  packageName: string;
}

export function classifyStereotype(declaration: StereotypeInput): string | null {
  for (const stereotype of ANNOTATION_STEREOTYPES) {
    if (declaration.annotations.includes(stereotype)) {
      return stereotype;
    }
  }

  for (const segment of declaration.packageName.split('.')) {
    const stereotype = PACKAGE_CONVENTION_STEREOTYPES[segment.toLowerCase()];
    if (stereotype) {
      return stereotype;
    }
  }

  return null;
}
