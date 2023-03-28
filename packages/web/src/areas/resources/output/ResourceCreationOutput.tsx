import { CreatedStateItem } from '@haydenon/gen-server';
import { useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';
import JSONPretty from 'react-json-pretty';
import styled from 'styled-components';
import Disclosure from '../../../components/Disclosure';
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
  padding: var(--spacing-tiny) var(--spacing-base);
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

  const created = creatingState.state === ItemState.Completed;
  const header = useCallback(
    (open: boolean) => (
      <ResourceHeader>
        {name}{' '}
        {created ? (
          open ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )
        ) : null}
      </ResourceHeader>
    ),
    [name, created]
  );

  return (
    <ListItem>
      {created ? (
        <Disclosure label={header}>
          <JSONPretty theme={theme} data={values} />
        </Disclosure>
      ) : (
        <HeaderWrapper>{header(false)}</HeaderWrapper>
      )}
    </ListItem>
  );
};

const ResourceCreationOutput = ({ creatingState }: Props) => {
  const resourceNames = useMemo(
    () => Object.keys(creatingState),
    [creatingState]
  );
  const stateByResource = useMemo(
    () =>
      resourceNames.reduce(
        (acc, name) => ({
          ...acc,
          [name]: creatingState[name] ?? createUninitialised(),
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
