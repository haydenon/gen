import styled from 'styled-components';
import { Trash2, Maximize2, Minimize2, PlusCircle } from 'react-feather';

import CardComp from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import {
  DesiredResource,
  ErrorPathType,
} from './desired-resources/desired-resource';
import Button, { ButtonStyle, ButtonColour } from '../../components/Button';
import VisuallyHidden from '../../components/VisuallyHidden';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useResources } from './resource.hook';
import ResourceField from './fields/ResourceField';
import { PropertyDefinitionResponse } from '@haydenon/gen-server';
import { getFieldDisplayName } from './fields/field.utils';
import { Menu, MenuButton, MenuItem, MenuList } from '../../components/Menu';
import { generateDefaultValue } from '../../utilities/default-value.generator';
import { InputState } from '../../components/Input/Input';
import { useDesiredResources } from './desired-resources/desired-resource.hook';

interface Props {
  resource: DesiredResource;
  onChange: (resource: DesiredResource) => void;
  onDelete: () => void;
  onMaximiseToggle: () => void;
  maximised?: boolean;
}

const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: var(--spacing-small);
  align-items: flex-end;
  padding-bottom: var(--spacing-large);
`;

const ActionsWrapper = styled(motion.div)`
  display: flex;
  gap: var(--spacing-tiny);
  margin-left: auto;
`;

interface CardProps {
  maximised: boolean;
}

const Card = styled(CardComp)<CardProps>`
  height: ${(props) => (props.maximised ? '100%' : undefined)};
  overflow-y: ${(props) => (props.maximised ? 'auto' : undefined)};
  z-index: ${(props) => (props.maximised ? 2 : 'unset')};
  position: ${(props) => (props.maximised ? 'relative' : 'unset')};
`;

const ListItem = styled.li`
  display: flex;
  gap: var(--spacing-tiny);

  list-style: none;
  &:not(:last-child) {
    padding-bottom: var(--spacing-small);
  }

  --labelOffset: calc(
    var(--typography-size-small) * var(--typography-lineHeight) + 6px
  );
`;

const ResourceListItem = styled(ListItem)`
  padding-top: var(--labelOffset);
`;

const List = styled.ul`
  padding-left: 0;
`;

const AddIcon = styled(PlusCircle)`
  height: calc(1rem * var(--typography-lineHeight));
  margin-left: var(--spacing-tiny);
`;

interface FieldProps {
  resource: DesiredResource;
  field: PropertyDefinitionResponse;
  onRemoveSpecified: () => void;
  onChange: (value: any) => void;
  desiredResourceId: string;
}

const ResourceFieldItem = ({
  resource,
  field,
  onRemoveSpecified,
  onChange,
  desiredResourceId,
}: FieldProps) => {
  if (!(field.name in resource.fieldData)) {
    return null;
  }

  return (
    <ResourceListItem>
      <ResourceField
        value={resource.fieldData[field.name]}
        fieldDefinition={field}
        onRemoveField={onRemoveSpecified}
        onChange={onChange}
        desiredResourceId={desiredResourceId}
      />
    </ResourceListItem>
  );
};

const FieldMenuButton = styled(MenuButton)`
  padding-left: var(--spacing-small);
  padding-right: var(--spacing-small);
  display: flex;
`;

interface AddFieldProps {
  unspecifiedProperties: string[];
  onSpecifyField: (field: string) => void;
}

const AddSpecifiedField = ({
  unspecifiedProperties,
  onSpecifyField,
}: AddFieldProps) => {
  return (
    <Menu>
      <FieldMenuButton>
        Specify property <AddIcon size={18} />
      </FieldMenuButton>
      <MenuList>
        {unspecifiedProperties.map((prop) => (
          <MenuItem key={prop} onSelect={() => onSpecifyField(prop)}>
            {getFieldDisplayName(prop)}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const AllAddedMessage = styled.span`
  font-size: var(--typography-size-small);
`;

const ResourceCard = ({
  resource,
  onChange,
  onDelete,
  onMaximiseToggle,
  maximised,
}: Props) => {
  const { resourceNames, getResource } = useResources();
  const { formErrors } = useDesiredResources();

  const maximisedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (maximisedRef && maximisedRef.current && maximised) {
      const current = maximisedRef.current;
      const listener = (event: FocusEvent) => {
        if (!current.matches(':focus-within')) {
          // TODO: Re-enable/tweak to capture focus inside
          // onMaximiseToggle();
        }
      };
      current.addEventListener('focusout', listener);

      return () => current.removeEventListener('focusout', listener);
    }
  }, [maximisedRef, maximised, onMaximiseToggle]);

  const resourceDefinitionInputMap = resource.type
    ? getResource(resource.type)?.inputs ?? {}
    : {};

  const resourceDefinitionInputs = Object.keys(resourceDefinitionInputMap).map(
    (key) => resourceDefinitionInputMap[key]
  );

  const onTypeChange = (type: string) =>
    onChange({
      ...resource,
      type,
    });

  const onNameChange = (name: string) => onChange({ ...resource, name });

  const Icon = maximised ? Minimize2 : Maximize2;

  const onFieldRemoval = (field: string) => () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [field]: _, ...otherFields } = resource.fieldData;
    onChange({ ...resource, fieldData: otherFields });
  };

  const onSpecifyField = (field: string) => {
    const fields = {
      [field]: generateDefaultValue(resourceDefinitionInputMap[field].type),
      ...resource.fieldData,
    };
    onChange({ ...resource, fieldData: fields });
  };

  const onFieldValueChange = (field: string) => (value: any) => {
    const fields = { ...resource.fieldData, [field]: value };
    onChange({ ...resource, fieldData: fields });
  };

  const unspecifiedProperties = resourceDefinitionInputs.filter(
    (i) => !(i.name in resource.fieldData)
  );

  // TODO: Use error details
  const nameErrored = !!formErrors.find(
    (err) =>
      err.resourceId === resource.id &&
      err.pathType === ErrorPathType.Root &&
      err.path.length === 1 &&
      err.path[0] === 'name'
  );

  return (
    <Card cardRef={maximisedRef} maximised={maximised ?? false}>
      <Header>
        <motion.div layout="position">
          <Select label="Type" value={resource.type} onChange={onTypeChange}>
            {resourceNames.map((key) => (
              <option value={key} key={key}>
                {key}
              </option>
            ))}
          </Select>
        </motion.div>
        <motion.div layout="position">
          <Input
            label="Name"
            placeholder="SomePerson"
            value={resource.name ?? ''}
            onChange={onNameChange}
            state={nameErrored ? InputState.Error : InputState.Normal}
          />
        </motion.div>
        <ActionsWrapper layout="position">
          <Button buttonStyle={ButtonStyle.Icon} onClick={onMaximiseToggle}>
            <VisuallyHidden>Maximise resource details</VisuallyHidden>
            <Icon size={16} strokeWidth={3} />
          </Button>
          <Button
            buttonStyle={ButtonStyle.Icon}
            colour={ButtonColour.Danger}
            onClick={onDelete}
          >
            <VisuallyHidden>Delete desired state entry</VisuallyHidden>
            <Trash2 size={16} strokeWidth={3} />
          </Button>
        </ActionsWrapper>
      </Header>

      {maximised ? null : (
        <motion.div layout="position">
          {resource.type ?? '(type not selected)'}
          <br />
          {resource.name ?? '(no name)'}
        </motion.div>
      )}
      {maximised && resourceDefinitionInputs.length ? (
        <motion.div
          key={resource.type}
          initial={{ height: '0px', overflowY: 'hidden' }}
          animate={{
            height: 'unset',
            overflowY: 'unset',
            transition: { delay: 0.1 },
          }}
          exit={{
            height: '0px',
            overflowY: 'hidden',
            transition: { duration: 0.3 },
          }}
        >
          <List>
            <AnimatePresence>
              {resourceDefinitionInputs.map((input) => (
                <ResourceFieldItem
                  key={input.name}
                  resource={resource}
                  field={input}
                  onRemoveSpecified={onFieldRemoval(input.name)}
                  onChange={onFieldValueChange(input.name)}
                  desiredResourceId={resource.id}
                ></ResourceFieldItem>
              ))}
              {unspecifiedProperties.length > 0 ? (
                <ListItem key="add-specified-field">
                  <AddSpecifiedField
                    unspecifiedProperties={unspecifiedProperties.map(
                      (p) => p.name
                    )}
                    onSpecifyField={onSpecifyField}
                  />
                </ListItem>
              ) : (
                <ListItem key="all-added">
                  <AllAddedMessage>All properties specified </AllAddedMessage>
                </ListItem>
              )}
            </AnimatePresence>
          </List>
        </motion.div>
      ) : null}
    </Card>
  );
};

export default ResourceCard;
