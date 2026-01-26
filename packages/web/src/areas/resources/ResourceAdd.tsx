import { v4 as uuid } from 'uuid';
import { ResourceResponse } from '@haydenon/gen-server';
import { PlusCircle, Zap } from 'react-feather';
import styled from 'styled-components';
import { Menu, MenuComboList } from '../../components/Menu/Menu';
import { DesiredResource } from './desired-resources/desired-resource';
import { useMemo, useState, useCallback } from 'react';
import AIGenerationModal from '../../components/AIGenerationModal';
import { useEnvironments } from '../environments/environment.hook';
import {
  replaceRuntimeValueTemplates,
  parse,
  isRuntimeValue,
  Expr,
  Visitor,
  acceptExpr,
  identifier,
  type Literal,
  type Variable,
  type GetProp,
  type Call,
  type ObjectConstructor,
  type ArrayConstructor,
  type FormatString,
  type FunctionValue,
} from '@haydenon/gen-core';
import { createFormRuntimeValue } from './runtime-value';

interface ResourceChooserProps {
  resources: ResourceResponse[];
  onResourceSelect: (type: string) => void;
}

const ResourceChooser = ({
  onResourceSelect,
  resources,
}: ResourceChooserProps) => {
  const resourceNames = useMemo(
    () => resources.map((r) => r.name),
    [resources]
  );

  return (
    <Menu
      label={() => (
        <AddButton>
          Add resource <AddIcon size={18 * 1.2} />
        </AddButton>
      )}
      $composite={false}
    >
      <MenuComboList list={resourceNames} onItemSelect={onResourceSelect} />
    </Menu>
  );
};

const AddWrapper = styled.div`
  display: flex;
  gap: var(--spacing-small);
`;

const AddButton = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const AIButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-small) var(--spacing-base);
  border: 1px solid var(--colour-border);
  border-radius: var(--border-radius);
  background: var(--colour-background-input);
  color: var(--colour-text);
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

const AIIcon = styled(Zap)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: (res: DesiredResource) => void;
  onAddMultiple: (resources: DesiredResource[]) => void;
  onClearAll?: () => void;
  resources: ResourceResponse[];
}

// Visitor that converts resource names to IDs in expressions
class NameToIdVisitor implements Visitor<Expr> {
  constructor(private nameToIdMap: { [name: string]: string }) {}

  visitLiteralExpr(expr: Literal): Expr {
    return expr;
  }

  visitArrayConstructorExpr(expr: ArrayConstructor): Expr {
    return Expr.ArrayConstructor(
      expr.items.map((exp) => acceptExpr(this, exp))
    );
  }

  visitObjectConstructorExpr(expr: ObjectConstructor): Expr {
    return Expr.ObjectConstructor(
      expr.fields.map(([tok, exp]) => [tok, acceptExpr(this, exp)])
    );
  }

  visitVariableExpr(expr: Variable): Expr {
    const name = expr.name.lexeme;
    // If this variable name is a resource name, replace with ID
    if (this.nameToIdMap[name]) {
      return Expr.Variable(identifier(this.nameToIdMap[name]));
    }
    return expr;
  }

  visitCallExpr(expr: Call): Expr {
    return Expr.Call(
      acceptExpr(this, expr.callee),
      expr.args.map((exp) => acceptExpr(this, exp))
    );
  }

  visitGetExpr(expr: GetProp): Expr {
    return Expr.GetProp(
      acceptExpr(this, expr.obj),
      acceptExpr(this, expr.indexer)
    );
  }

  visitFormatString(expr: FormatString): Expr {
    return Expr.FormatString(
      expr.strings,
      expr.expressions.map((exp) => acceptExpr(this, exp))
    );
  }

  visitFunctionExpr(expr: FunctionValue): Expr {
    return expr;
  }
}

// Convert RuntimeValue objects to FormRuntimeValue objects
const convertToFormRuntimeValues = (
  value: any,
  nameToIdMap: { [name: string]: string }
): any => {
  if (isRuntimeValue(value)) {
    // Map dependent resource names to IDs
    const dependentResourceIds = value.depdendentStateNames
      .map((name) => nameToIdMap[name])
      .filter((id) => id !== undefined);

    // Transform expression to replace names with IDs
    const visitor = new NameToIdVisitor(nameToIdMap);
    const transformedExpression = acceptExpr(visitor, value.expression);

    return createFormRuntimeValue(
      undefined, // textInput not needed for AI-generated values
      transformedExpression,
      dependentResourceIds
    );
  }

  if (value instanceof Array) {
    return value.map((item) => convertToFormRuntimeValues(item, nameToIdMap));
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = convertToFormRuntimeValues(value[key], nameToIdMap);
      return acc;
    }, {} as any);
  }

  return value;
};

const ResourceAdd = ({ onAdd, onAddMultiple, onClearAll, resources }: AddProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentEnvironment } = useEnvironments();

  const handleGenerate = useCallback(
    async (prompt: string, replaceMode: boolean) => {
      if (!currentEnvironment) {
        throw new Error('No environment selected');
      }

      const response = await fetch('/v1/generate-scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioPrompt: prompt,
          environment: currentEnvironment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message || 'Failed to generate scenario';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Clear existing resources if in replace mode
      if (replaceMode && onClearAll) {
        onClearAll();
      }

      // Add generated resources
      if (data.resources && data.resources.length > 0) {
        // Pre-generate IDs for all resources
        const resourceIds = data.resources.map(() => uuid());

        // Create name-to-ID mapping
        const nameToIdMap: { [name: string]: string } = {};
        data.resources.forEach((stateItem: any, index: number) => {
          if (stateItem._name) {
            nameToIdMap[stateItem._name] = resourceIds[index];
          }
        });

        const newResources = data.resources.map((stateItem: any, index: number) => {
          const { _type, _name, ...fieldData } = stateItem;

          // Parse runtime value templates (expressions like ${resource.property})
          const [parsedFieldData, errors] = replaceRuntimeValueTemplates(
            fieldData,
            parse
          );

          if (errors.length > 0) {
            console.error('Expression parsing errors:', errors);
          }

          // Convert RuntimeValue objects to FormRuntimeValue objects
          const convertedFieldData = convertToFormRuntimeValues(
            parsedFieldData,
            nameToIdMap
          );

          return {
            id: resourceIds[index],
            type: _type,
            name: _name,
            fieldData: convertedFieldData as { [property: string]: any },
          };
        });
        onAddMultiple(newResources);
      }

      // Log errors if any
      if (data.errors && data.errors.length > 0) {
        console.error('AI generation warnings:', data.errors);
      }
    },
    [currentEnvironment, onAddMultiple, onClearAll]
  );

  return (
    <>
      <AddWrapper>
        <ResourceChooser
          onResourceSelect={(type) =>
            onAdd({
              id: uuid(),
              type,
              fieldData: {},
            })
          }
          resources={resources}
        />
        <AIButton onClick={() => setIsModalOpen(true)}>
          AI Generate <AIIcon size={18} />
        </AIButton>
      </AddWrapper>

      <AIGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        environment={currentEnvironment || ''}
      />
    </>
  );
};

export default ResourceAdd;
