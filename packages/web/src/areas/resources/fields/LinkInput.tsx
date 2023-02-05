import { containsType, ExprType, outputExprType } from '@haydenon/gen-core';
import { LinkTypeResponse, PropertyTypeResponse } from '@haydenon/gen-server';
import { useState } from 'react';
import { ChevronLeft, Link } from 'react-feather';
import styled from 'styled-components';
import Button, { ButtonColour } from '../../../components/Button';
import CodeText from '../../../components/CodeText';
import { Menu, MenuButton, MenuItem, MenuList } from '../../../components/Menu';
import { menuItemStyles } from '../../../components/Menu/Menu';
import { mapPropTypeRespToExprType } from '../../../utilities/property-type-expr-type.mappers';
import { useDesiredResources } from '../desired-resource.hook';
import { useResources } from '../resource.hook';
import { DesiredResource } from '../ResourceList';
import { getFieldDisplayName } from './field.utils';

import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: LinkTypeResponse;
  value: string | number | undefined | null;
  onChange: (value: string | number | undefined | null) => void;
}

const LinkButton = styled(MenuButton)`
  align-self: flex-end;
  padding-left: var(--spacing-tiny);
  padding-right: var(--spacing-tiny);
  background: var(--colors-contentBackground-light);

  &:hover {
    background: var(--colors-contentBackground-light-focusable);
  }

  &:active {
    background: var(--colors-contentBackground-light-focused);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--colors-text-disabled);
    background: var(--colors-contentBackground-light-disabled);
  }
`;

const ResourceItem = styled.div`
  ${menuItemStyles}

  display: flex;
  flex-direction: column;
`;

const SmallText = styled.span`
  font-size: var(--typography-size-small);
`;

const OtherResources = styled(SmallText)`
  display: block;
  margin: var(--spacing-tiny) var(--spacing-small);
  padding-top: var(--spacing-tiny);

  border-top: 1px solid var(--colors-contentBackground-light);
`;

interface ResourceChooserProps {
  currentResourceId: number;
  resources: DesiredResource[];
  onResourceSelect: (id: number) => void;
}

const ResourceChooser = ({
  resources,
  currentResourceId,
  onResourceSelect,
}: ResourceChooserProps) => {
  const otherResources = resources.filter(
    (r) => r.id !== currentResourceId && r.type
  );
  const namedResources = otherResources.filter((r) => r.name);
  const unnamedResourceCount = otherResources.length - namedResources.length;
  return (
    <>
      {namedResources.map((r) => (
        <ResourceItem
          onClick={() => onResourceSelect(r.id)}
          key={'resource-' + r.id}
          role="menuitem"
        >
          <span>{r.name}</span>
          <SmallText>{r.type}</SmallText>
        </ResourceItem>
      ))}
      {unnamedResourceCount > 0 ? (
        <OtherResources>
          {unnamedResourceCount} unnamed resource
          {unnamedResourceCount > 1 ? 's' : ''}
        </OtherResources>
      ) : null}
    </>
  );
};

const ChosenResource = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
`;

const FieldPickerControls = styled.div`
  display: flex;
  border-bottom: 1px solid var(--colors-contentBackground-light);
  padding-bottom: var(--spacing-tiny);
`;

const BackButton = styled(Button)`
  padding: var(--spacing-large) var(--spacing-large) var(--spacing-large)
    var(--spacing-tiny);
  display: flex;
  gap: var(--spacing-tiny);
  align-items: center;
`;

const AssignableToText = styled(SmallText)`
  display: block;
  padding: var(--spacing-small);
`;

interface FieldChooserProps {
  fieldType: PropertyTypeResponse;
  selectedResource: DesiredResource;
  onFieldSelect: (field: string) => void;
  onResourceDeselect: () => void;
}

const getTypeDisplay = (type: ExprType): string => outputExprType(type);

const FieldChooser = ({
  fieldType,
  selectedResource,
  onFieldSelect,
  onResourceDeselect,
}: FieldChooserProps) => {
  const { getResource } = useResources();
  const resource = getResource(selectedResource.type!);
  if (!resource) {
    return null;
  }
  const fields = Object.keys(resource.outputs);
  const fieldExprType = mapPropTypeRespToExprType(fieldType);
  const exprTypes = fields.reduce((acc, field) => {
    acc[field] = mapPropTypeRespToExprType(resource.outputs[field].type);
    return acc;
  }, {} as { [field: string]: ExprType });
  const validFields = fields.filter((field) =>
    containsType(exprTypes[field], fieldExprType)
  );
  const typeDisplay = getTypeDisplay(fieldExprType);
  return (
    <>
      <FieldPickerControls>
        <BackButton
          colour={ButtonColour.Transparent}
          onClick={onResourceDeselect}
        >
          <ChevronLeft size={18} />
          <ChosenResource>
            <span>{selectedResource.name}</span>
            <SmallText>{selectedResource.type}</SmallText>
          </ChosenResource>
        </BackButton>
      </FieldPickerControls>
      <AssignableToText>
        Fields assignable to <CodeText>{typeDisplay}</CodeText>
      </AssignableToText>
      {validFields.map((key) => (
        <MenuItem key={key} onSelect={() => onFieldSelect(key)}>
          <div>{getFieldDisplayName(key)}</div>
          <SmallText>
            <CodeText>{getTypeDisplay(exprTypes[key])}</CodeText>
          </SmallText>
        </MenuItem>
      ))}
    </>
  );
};

interface ChooserProps {
  currentResourceId: number;
  fieldType: PropertyTypeResponse;
  onFieldSelect: (desiredResourceId: number, field: string) => void;
}

const LinkValueChooser = ({
  currentResourceId,
  fieldType,
  onFieldSelect,
}: ChooserProps) => {
  const [resource, setResource] = useState<number | null>(null);
  const { desiredResources } = useDesiredResources();
  const resources = desiredResources.value;
  if (!resources) {
    return null;
  }

  const selectedResource = resource && resources.find((r) => r.id === resource);

  return (
    <Menu>
      <LinkButton>
        <Link size={18} />
      </LinkButton>
      <MenuList>
        {!selectedResource ? (
          <ResourceChooser
            currentResourceId={currentResourceId}
            resources={resources}
            onResourceSelect={setResource}
          />
        ) : (
          <FieldChooser
            fieldType={fieldType}
            selectedResource={selectedResource}
            onFieldSelect={(field) => onFieldSelect(resource, field)}
            onResourceDeselect={() => setResource(null)}
          />
        )}
      </MenuList>
    </Menu>
  );
};

const LinkInput = ({ type, value, onChange, context, ...baseProps }: Props) => {
  return (
    <>
      <InputForType
        type={type.inner}
        value={value}
        onChange={onChange}
        context={context}
        {...baseProps}
      />
      <LinkValueChooser
        fieldType={type.inner}
        currentResourceId={context.desiredResourceId}
        onFieldSelect={console.log}
      />
    </>
  );
};

export default LinkInput;
