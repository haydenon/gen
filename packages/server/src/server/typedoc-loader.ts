import * as fs from 'fs';
import * as path from 'path';

/**
 * TypeDoc type reference structure
 */
export interface TypeDocTypeReference {
  type: string;
  target?: number | { packageName?: string; packagePath?: string; qualifiedName?: string };
  name?: string;
  package?: string;
  typeArguments?: TypeDocTypeReference[];
}

/**
 * TypeDoc JSON structure (simplified - we'll expand as needed)
 */
export interface TypeDocReflection {
  id: number;
  name: string;
  kind: number;
  kindString?: string;
  flags?: {
    isExported?: boolean;
    isPublic?: boolean;
    isPrivate?: boolean;
    isProtected?: boolean;
  };
  comment?: {
    summary?: Array<{ kind: string; text: string }>;
    blockTags?: Array<{
      tag: string;
      content: Array<{ kind: string; text: string }>;
    }>;
  };
  children?: TypeDocReflection[];
  signatures?: TypeDocReflection[];
  type?: any;
  extendedTypes?: TypeDocTypeReference[];
  sources?: Array<{
    fileName: string;
    line: number;
    character: number;
  }>;
}

export interface TypeDocJSON {
  id: number;
  name: string;
  kind: number;
  children?: TypeDocReflection[];
}

export interface ParsedTypeDoc {
  raw: TypeDocJSON;
  byId: Map<number, TypeDocReflection>;
  byName: Map<string, TypeDocReflection[]>;
}

/**
 * Load and parse a TypeDoc JSON file
 */
export function loadTypeDocFile(filePath: string): ParsedTypeDoc {
  // Resolve relative paths
  const resolvedPath = path.resolve(filePath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`TypeDoc file not found: ${resolvedPath}`);
  }

  // Read and parse the JSON
  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  let raw: TypeDocJSON;
  try {
    raw = JSON.parse(fileContent);
  } catch (err) {
    throw new Error(
      `Failed to parse TypeDoc JSON file: ${(err as Error).message}`
    );
  }

  // Build lookup maps
  const byId = new Map<number, TypeDocReflection>();
  const byName = new Map<string, TypeDocReflection[]>();

  function indexReflection(reflection: TypeDocReflection) {
    // Index by ID
    byId.set(reflection.id, reflection);

    // Index by name
    const existing = byName.get(reflection.name) || [];
    existing.push(reflection);
    byName.set(reflection.name, existing);

    // Recursively index children
    if (reflection.children) {
      reflection.children.forEach(indexReflection);
    }

    // Recursively index signatures
    if (reflection.signatures) {
      reflection.signatures.forEach(indexReflection);
    }
  }

  // Index the entire tree
  if (raw.children) {
    raw.children.forEach(indexReflection);
  }

  return {
    raw,
    byId,
    byName,
  };
}

/**
 * Extract comment text from TypeDoc comment structure
 */
export function extractCommentText(
  comment?: TypeDocReflection['comment']
): string | undefined {
  if (!comment) {
    return undefined;
  }

  const parts: string[] = [];

  // Extract summary
  if (comment.summary) {
    const summaryText = comment.summary
      .map((part) => part.text)
      .join('')
      .trim();
    if (summaryText) {
      parts.push(summaryText);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

/**
 * Find a reflection by name and optional kind
 */
export function findReflection(
  parsed: ParsedTypeDoc,
  name: string,
  kind?: number
): TypeDocReflection | undefined {
  const reflections = parsed.byName.get(name);
  if (!reflections || reflections.length === 0) {
    return undefined;
  }

  if (kind !== undefined) {
    return reflections.find((r) => r.kind === kind);
  }

  return reflections[0];
}
