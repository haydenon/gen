import styled from 'styled-components';
import { Trash2, Maximize2, Minimize2 } from 'react-feather';

import CardComp from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { Resource } from './ResourceList';
import Button, { ButtonStyle, ButtonColour } from '../../components/Button';
import VisuallyHidden from '../../components/VisuallyHidden';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useResources } from './resource.hook';
import ResourceField from './fields/ResourceField';

interface Props {
  resource: Resource;
  onChange: (resource: Resource) => void;
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
  min-height: ${(props) => (props.maximised ? '100%' : undefined)};
  z-index: ${(props) => (props.maximised ? 2 : 'unset')};
  position: ${(props) => (props.maximised ? 'relative' : 'unset')};
`;

const ListItem = styled.li`
  display: flex;
  gap: var(--spacing-small);

  list-style: none;
  &:not(:last-child) {
    padding-bottom: var(--spacing-small);
  }
`;

const List = styled.ul`
  padding-left: 0;
`;

const ResourceCard = ({
  resource,
  onChange,
  onDelete,
  onMaximiseToggle,
  maximised,
}: Props) => {
  const { resourceNames, getResource } = useResources();

  const maximisedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (maximisedRef && maximisedRef.current && maximised) {
      const current = maximisedRef.current;
      const listener = (event: FocusEvent) => {
        if (!current.matches(':focus-within')) {
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
          />
        </motion.div>
        <ActionsWrapper layout="position">
          <Button style={ButtonStyle.Icon} onClick={onMaximiseToggle}>
            <VisuallyHidden>Maximise resource details</VisuallyHidden>
            <Icon size={16} strokeWidth={3} />
          </Button>
          <Button
            style={ButtonStyle.Icon}
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
          // layout="position"
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
                <ListItem key={input.name}>
                  <ResourceField value={''} fieldDefinition={input} />
                </ListItem>
              ))}
            </AnimatePresence>
          </List>
        </motion.div>
      ) : null}
    </Card>
  );
};

export default ResourceCard;
