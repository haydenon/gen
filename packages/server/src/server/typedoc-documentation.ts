import { Resource, PropertyMap, PropertyDefinition } from '@haydenon/gen-core';
import {
  ParsedTypeDoc,
  TypeDocReflection,
  extractCommentText,
} from './typedoc-loader';

/**
 * TypeDoc kind constants
 */
const TypeDocKind = {
  Class: 128,
  Property: 1024,
} as const;

/**
 * Populate resource and property descriptions from TypeDoc JSON
 *
 * For each resource:
 * 1. Finds the matching TypeDoc class declaration
 * 2. Verifies it extends Resource
 * 3. Extracts class documentation and calls setDescription on the resource
 * 4. Finds the inputs and outputs type arguments from Resource<Inputs, Outputs>
 * 5. Matches properties in inputs/outputs with TypeDoc properties
 * 6. Calls setDescription on matching property definitions
 *
 * @param resources Array of resources to populate
 * @param typedoc Parsed TypeDoc JSON data
 */
export function populateDocumentationFromTypeDoc(
  resources: Resource<PropertyMap, PropertyMap>[],
  typedoc: ParsedTypeDoc
): void {
  console.log(
    `\n📚 Populating documentation from TypeDoc for ${resources.length} resources...`
  );

  let resourcesDocumented = 0;
  let propertiesDocumented = 0;

  for (const resource of resources) {
    const className = resource.name;

    // Find the TypeDoc reflection for this resource class
    const classReflection = findClassReflection(typedoc, className);
    if (!classReflection) {
      continue;
    }

    // Verify it extends Resource
    if (!extendsResource(classReflection)) {
      console.log(
        `   ⚠️  ${className}: Found class but does not extend Resource`
      );
      continue;
    }

    // Extract and set class documentation
    const classComment = extractCommentText(classReflection.comment);
    if (classComment) {
      (resource as any).setDescription(classComment);
      resourcesDocumented++;
    }

    // Find inputs and outputs type arguments
    const { inputsId, outputsId } = getInputsOutputsIds(classReflection);
    if (!inputsId || !outputsId) {
      continue;
    }

    // Get the inputs and outputs class reflections
    const inputsReflection = typedoc.byId.get(inputsId);
    const outputsReflection = typedoc.byId.get(outputsId);

    // Populate property descriptions for inputs
    if (inputsReflection) {
      const inputPropsDocumented = populatePropertyDescriptions(
        resource.inputs,
        inputsReflection,
        typedoc
      );
      propertiesDocumented += inputPropsDocumented;
    }

    // Populate property descriptions for outputs
    if (outputsReflection) {
      const outputPropsDocumented = populatePropertyDescriptions(
        resource.outputs,
        outputsReflection,
        typedoc
      );
      propertiesDocumented += outputPropsDocumented;
    }
  }

  console.log(`✅ Documentation populated:`);
  console.log(`   - ${resourcesDocumented} resources documented`);
  console.log(`   - ${propertiesDocumented} properties documented`);
}

/**
 * Find a class reflection by name in the TypeDoc data
 */
function findClassReflection(
  typedoc: ParsedTypeDoc,
  className: string
): TypeDocReflection | undefined {
  const reflections = typedoc.byName.get(className);
  if (!reflections) {
    return undefined;
  }

  // Find the class declaration (kind 128)
  return reflections.find((r) => r.kind === TypeDocKind.Class);
}

/**
 * Check if a class extends Resource
 */
function extendsResource(classReflection: TypeDocReflection): boolean {
  if (!classReflection.extendedTypes) {
    return false;
  }

  for (const extendedType of classReflection.extendedTypes) {
    if (
      extendedType.type === 'reference' &&
      extendedType.name === 'Resource' &&
      extendedType.package === '@haydenon/gen-core'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract the inputs and outputs type IDs from Resource<Inputs, Outputs>
 */
function getInputsOutputsIds(classReflection: TypeDocReflection): {
  inputsId: number | undefined;
  outputsId: number | undefined;
} {
  if (!classReflection.extendedTypes) {
    return { inputsId: undefined, outputsId: undefined };
  }

  // Find the Resource<Inputs, Outputs> extended type
  const resourceType = classReflection.extendedTypes.find(
    (t: any) =>
      t.type === 'reference' &&
      t.name === 'Resource' &&
      t.package === '@haydenon/gen-core'
  );

  if (!resourceType || !resourceType.typeArguments) {
    return { inputsId: undefined, outputsId: undefined };
  }

  // Extract type argument IDs
  const typeArgs = resourceType.typeArguments;
  const inputsArg = typeArgs[0];
  const outputsArg = typeArgs[1];

  const inputsId =
    inputsArg?.type === 'reference' && typeof inputsArg.target === 'number'
      ? inputsArg.target
      : undefined;

  const outputsId =
    outputsArg?.type === 'reference' && typeof outputsArg.target === 'number'
      ? outputsArg.target
      : undefined;

  return { inputsId, outputsId };
}

/**
 * Populate property descriptions from TypeDoc reflection
 *
 * Recursively walks up the inheritance chain to find all properties
 * and their documentation.
 */
function populatePropertyDescriptions(
  propertyMap: PropertyMap,
  classReflection: TypeDocReflection,
  typedoc: ParsedTypeDoc,
  visited: Set<number> = new Set()
): number {
  let count = 0;

  // Avoid infinite loops
  if (visited.has(classReflection.id)) {
    return count;
  }
  visited.add(classReflection.id);

  // Process properties in this class
  if (classReflection.children) {
    for (const child of classReflection.children) {
      if (child.kind === TypeDocKind.Property) {
        const propertyName = child.name;
        const propertyDef = propertyMap[propertyName];

        if (propertyDef) {
          const comment = extractCommentText(child.comment);
          if (comment) {
            propertyDef.setDescription(comment);
            count++;
          }
        }
      }
    }
  }

  // Recursively process extended types (parent classes)
  if (classReflection.extendedTypes) {
    for (const extendedType of classReflection.extendedTypes) {
      if (
        extendedType.type === 'reference' &&
        typeof extendedType.target === 'number'
      ) {
        const parentReflection = typedoc.byId.get(extendedType.target);
        if (parentReflection) {
          count += populatePropertyDescriptions(
            propertyMap,
            parentReflection,
            typedoc,
            visited
          );
        }
      }
    }
  }

  return count;
}
