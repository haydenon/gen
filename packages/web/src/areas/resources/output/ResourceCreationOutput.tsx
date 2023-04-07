import { CreatedStateItem } from '@haydenon/gen-server';
import { useCallback, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'react-feather';
import JSONPretty from 'react-json-pretty';
import styled from 'styled-components';
import Disclosure from '../../../components/Disclosure';
import Loader from '../../../components/Loader';
import { createUninitialised, Item, ItemState } from '../../../data';
import { DesiredResource } from '../desired-resources/desired-resource';
import { CreatingState } from '../desired-resources/desired-resource.state';

const COLOURS = {
  background: 'var(--code-background)',
  main: 'var(--code-main)',
  key: 'var(--code-key)',
  string: 'var(--code-string)',
  value: 'var(--code-value)',
};

const theme = {
  main: `line-height:1.3;color:${COLOURS.main};background:inherit;overflow:auto;`,
  error: `line-height:1.3;color:${COLOURS.main};background:inherit;overflow:auto;`,
  key: `color:${COLOURS.key};`,
  string: `color:${COLOURS.string};`,
  value: `color:${COLOURS.value};`,
  boolean: `color:${COLOURS.value};`,
};

const Wrapper = styled.ul`
  background: ${COLOURS.background};
  padding: var(--spacing-base);
  border-radius: var(--borders-radius);
  margin: 0;

  max-width: 100%;

  & pre {
    margin: 0;
  }
`;

interface Props {
  resources: DesiredResource[];
  creatingState: CreatingState;
}

interface ResourceProps {
  creatingState: Item<CreatedStateItem>;
  name: string;
}

const ListItem = styled.li`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);

  padding: var(--spacing-tiny) 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--colors-contentBackground-light-disabled);
  }
`;

const ResourceHeader = styled.div`
  font-size: var(--typography-size-header-5);
`;

const HeaderWrapper = styled.div`
  padding: var(--spacing-tiny);
`;

const StatusColour = styled.span<{ colour: string }>`
  color: var(${(props) => props.colour});
`;

const Icon = ({ state }: { state: ItemState }) => {
  switch (state) {
    case ItemState.Completed:
      return <CheckCircle size={18} />;
    case ItemState.Loading:
      return <Loader size={18} />;
    case ItemState.Errored:
      return <AlertCircle size={18} />;
    case ItemState.Uninitialised:
      return null;
  }
};

const colours: { [state: string]: string } = {
  [ItemState.Completed]: '--colors-contentBackground-success-disabled',
  [ItemState.Loading]: '--colors-text',
  [ItemState.Errored]: '--colors-contentBackground-danger-disabled',
};

const Chevron = styled.span`
  padding-right: 4px;
`;

const StatusIcon = ({ state, open }: { state: ItemState; open: boolean }) => {
  if (state === ItemState.Uninitialised) {
    return null;
  }

  const colour = colours[state];
  return (
    <>
      {state === ItemState.Completed ? (
        <Chevron>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Chevron>
      ) : null}
      <StatusColour colour={colour}>
        <Icon state={state} />
      </StatusColour>
    </>
  );
};

const ContextMessage = styled.div`
  color: var(--colors-contentBackground-danger-disabled);
  font-size: var(--typography-size-small);
  line-height: 1;
  padding-bottom: var(--spacing-small);
`;

const OutputWrapper = styled.div`
  padding: var(--spacing-small) 0 var(--spacing-tiny);
`;

const ResourceOutput = ({ creatingState, name }: ResourceProps) => {
  const values = useMemo(() => {
    if (creatingState.value) {
      const { _name, _type, ...properties } = creatingState.value;
      return properties;
    } else {
      return {};
    }
  }, [creatingState]);

  const createState = creatingState.state;
  const header = useCallback(
    (open: boolean) => (
      <ResourceHeader>
        {name} <StatusIcon state={createState} open={open} />
      </ResourceHeader>
    ),
    [name, createState]
  );

  return (
    <ListItem>
      {createState === ItemState.Completed ? (
        <Disclosure label={header}>
          <OutputWrapper>
            <JSONPretty theme={theme} data={values} />
          </OutputWrapper>
        </Disclosure>
      ) : (
        <HeaderWrapper>{header(false)}</HeaderWrapper>
      )}
      {createState === ItemState.Errored ? (
        <ContextMessage>{creatingState.error.message}</ContextMessage>
      ) : null}
    </ListItem>
  );
};

const ResourceCreationOutput = ({ creatingState }: Props) => {
  const resourceNames = useMemo(
    () => Object.keys(creatingState.resources),
    [creatingState]
  );
  const stateByResource = useMemo(
    () =>
      resourceNames.reduce(
        (acc, name) => ({
          ...acc,
          [name]: creatingState.resources[name] ?? createUninitialised(),
        }),
        {} as { [name: string]: Item<CreatedStateItem> }
      ),
    [creatingState, resourceNames]
  );
  return (
    <Wrapper>
      {resourceNames.map((name) => (
        <ResourceOutput
          key={name}
          name={name}
          creatingState={stateByResource[name]}
        />
      ))}
    </Wrapper>
  );
};

export default ResourceCreationOutput;
