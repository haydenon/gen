import {
  containsType,
  ExprType,
  GetProp,
  identifier,
  Literal,
  outputExprType,
  Variable,
} from '@haydenon/gen-core';
import { LinkTypeResponse, PropertyTypeResponse } from '@haydenon/gen-server';
import { useMemo } from 'react';
import { ArrowRight, Edit, Link } from 'react-feather';
import styled from 'styled-components';
import Button, { ButtonStyle } from '../../../components/Button';
import CodeText from '../../../components/CodeText';
import { InputState, ReadOnlyInput } from '../../../components/Input/Input';
import { Menu, MenuItem } from '../../../components/Menu/Menu';
import { mapPropTypeRespToExprType } from '../../../utilities/property-type-expr-type.mappers';
import { useDesiredResources } from '../desired-resources/desired-resource.hook';
import { useResources } from '../resource.hook';
import { DesiredStateFormError } from '../desired-resources/desired-resource';
import { FormRuntimeValue } from '../runtime-value';
import { getFieldDisplayName } from './field.utils';

import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';
import { generateDefaultValue } from '../../../utilities/default-value.generator';

interface Props extends BaseInputProps {
  type: LinkTypeResponse;
  value: FormRuntimeValue | string | number | undefined | null;
  onChange: (
    value: FormRuntimeValue | string | number | undefined | null
  ) => void;
}

const SmallText = styled.span`
  font-size: var(--typography-size-small);
  font-weight: normal;
`;

const NoItems = styled(SmallText)`
  margin: var(--spacing-tiny) var(--spacing-small);
  padding-top: var(--spacing-tiny);
`;

const OtherResources = styled(SmallText)`
  display: block;
  margin: var(--spacing-tiny) var(--spacing-small);
  padding-top: var(--spacing-tiny);

  border-top: 1px solid var(--colors-contentBackground-light);
`;

const ChosenResource = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  font-weight: normal;
  padding-bottom: var(--spacing-tiny);
`;

const AssignableToText = styled(SmallText)`
  display: block;
  padding: var(--spacing-small);
`;

const getTypeDisplay = (type: ExprType): string => outputExprType(type);

interface ChooserProps {
  currentResourceId: string;
  fieldType: PropertyTypeResponse;
  onFieldSelect: (desiredResourceId: string, field: string) => void;
}

const CustomMenu = styled(Menu)`
  margin-right: -8px;
`;

const LinkValueChooser = ({
  currentResourceId,
  fieldType,
  onFieldSelect,
}: ChooserProps) => {
  const { desiredResources } = useDesiredResources();
  const { getResource } = useResources();
  const resources = desiredResources.value;
  if (!resources) {
    return null;
  }

  // const selectedResource = resource && resources.find((r) => r.id === resource);
  const otherResources = resources.filter(
    (r) => r.id !== currentResourceId && r.type
  );
  const namedResources = otherResources.filter((r) => r.name);
  const unnamedResourceCount = otherResources.length - namedResources.length;

  const resourceFields = otherResources
    .map((r) => r.type)
    .reduce((acc, type) => {
      const resourceType = getResource(type);
      if (!resourceType || type in acc) {
        return acc;
      }

      const fields = Object.keys(resourceType.outputs);
      const fieldExprType = mapPropTypeRespToExprType(fieldType);
      const exprTypes = fields.reduce((acc, field) => {
        acc[field] = mapPropTypeRespToExprType(
          resourceType.outputs[field].type
        );
        return acc;
      }, {} as { [field: string]: ExprType });
      const validFields = fields.filter((field) =>
        containsType(exprTypes[field], fieldExprType)
      );
      const typeDisplay = getTypeDisplay(fieldExprType);

      acc[type] = {
        typeDisplay,
        validFields,
        exprTypes,
      };
      return acc;
    }, {} as { [type: string]: { typeDisplay: string; validFields: string[]; exprTypes: { [field: string]: ExprType } } });

  return (
    // <Menu>
    //   <LinkButton>
    //     <Link size={18} />
    //   </LinkButton>
    //   <MenuList>
    //     {!selectedResource ? (
    //       <ResourceChooser
    //         currentResourceId={currentResourceId}
    //         resources={resources}
    //         onResourceSelect={setResource}
    //       />
    //     ) : (
    //       <FieldChooser
    //         fieldType={fieldType}
    //         selectedResource={selectedResource}
    //         onFieldSelect={(field) => onFieldSelect(resource, field)}
    //         onResourceDeselect={() => setResource(null)}
    //       />
    //     )}
    //   </MenuList>
    // </Menu>
    <CustomMenu $buttonStyle={ButtonStyle.Icon} label={() => <Link size={18} />}>
      {namedResources.length === 0 ? (
        <NoItems>No named resources</NoItems>
      ) : null}
      {namedResources.map((r) => (
        <Menu
          label={(submenu) =>
            submenu ? (
              <ChosenResource>
                <span>{r.name}</span>
                <SmallText>{r.type}</SmallText>
              </ChosenResource>
            ) : (
              r.name
            )
          }
          key={'resource-' + r.id}
          role="menuitem"
        >
          {resourceFields[r.type].validFields.length === 0 ? (
            <AssignableToText>
              Nothing assignable to{' '}
              <CodeText>{resourceFields[r.type].typeDisplay}</CodeText>
            </AssignableToText>
          ) : (
            <AssignableToText>
              Assignable to{' '}
              <CodeText>{resourceFields[r.type].typeDisplay}</CodeText>
            </AssignableToText>
          )}
          {resourceFields[r.type].validFields.map((key) => (
            <MenuItem
              label={
                <>
                  <div>{getFieldDisplayName(key)}</div>
                  <SmallText>
                    <CodeText>
                      {getTypeDisplay(resourceFields[r.type].exprTypes[key])}
                    </CodeText>
                  </SmallText>
                </>
              }
              key={key}
              onClick={() => onFieldSelect(r.id, key)}
            ></MenuItem>
          ))}
        </Menu>
      ))}
      {unnamedResourceCount > 0 ? (
        <OtherResources>
          {unnamedResourceCount} unnamed resource
          {unnamedResourceCount > 1 ? 's' : ''}
        </OtherResources>
      ) : null}
    </CustomMenu>
  );
};

interface RuntimeValueProps {
  name: string | null;
  runtimeValue: FormRuntimeValue;
  errors: DesiredStateFormError[];
}

const ReadOnlyDisplay = styled(ReadOnlyInput)`
  margin-top: ${(props) =>
    props.label ? 'calc(-1 * var(--labelOffset))' : 'unset'};
`;

const LinkedRuntimeValueDisplay = ({
  name,
  runtimeValue,
  errors,
}: RuntimeValueProps) => {
  const { desiredResources } = useDesiredResources();
  const error: DesiredStateFormError | undefined = useMemo(
    () => errors[0],
    [errors]
  );
  if (
    !(runtimeValue.expression instanceof GetProp) ||
    desiredResources.value === undefined
  ) {
    return null;
  }

  const resources = desiredResources.value;
  const obj = runtimeValue.expression.obj;
  const indexer = runtimeValue.expression.indexer;
  if (!(obj instanceof Variable && indexer instanceof Literal)) {
    return null
  }

  const resource = resources.find((r) => r.id === obj.name.lexeme);

  return (
    <ReadOnlyDisplay
      label={name || ''}
      state={error !== undefined ? InputState.Error : undefined}
      message={error?.error.message}
    >
      <CodeText>{resource?.name || '<no name>'}</CodeText>
      <ArrowRight size={18} />
      <CodeText>{indexer.value}</CodeText>
    </ReadOnlyDisplay>
  );
};

const LinkInput = ({
  type,
  value,
  onChange,
  context,
  parentActions,
  errors,
  ...baseProps
}: Props) => {
  const onFieldChoose = (desiredResourceId: string, fieldName: string) => {
    onChange(
      new FormRuntimeValue(
        undefined,
        new GetProp(
          new Variable(identifier(desiredResourceId)),
          new Literal(fieldName)
        ),
        [desiredResourceId]
      )
    );
  };
  return (
    <>
      {value instanceof FormRuntimeValue && value.textInput === undefined ? (
        <>
          <LinkedRuntimeValueDisplay
            name={baseProps.name}
            runtimeValue={value}
            errors={errors}
          />
          <Button
            buttonStyle={ButtonStyle.Icon}
            onClick={() => onChange(generateDefaultValue(type))}
          >
            <Edit size={18} />
          </Button>
        </>
      ) : (
        <InputForType
          type={type.inner}
          value={value}
          onChange={onChange}
          context={context}
          parentActions={null}
          errors={errors}
          {...baseProps}
        />
      )}
      <LinkValueChooser
        fieldType={type.inner}
        currentResourceId={context.desiredResourceId}
        onFieldSelect={onFieldChoose}
      />
      {parentActions}
    </>
  );
};

export default LinkInput;
