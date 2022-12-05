import { createRef, useState } from 'react';
import { PlusCircle } from 'react-feather';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styled from 'styled-components';
import Button from '../../components/Button';
import ResourceCard from './ResourceCard';

export interface Resource {
  type?: string;
  name?: string;
  nodeRef: React.RefObject<any>;
}
const resources: Resource[] = [
  {
    type: 'product',
    name: 'SomeProduct',
    nodeRef: createRef(),
  },
  {
    type: 'product',
    name: 'OtherProduct',
    nodeRef: createRef(),
  },
  {
    type: 'service',
    name: 'SomeService',
    nodeRef: createRef(),
  },
  {
    type: 'member',
    name: 'SomeMember',
    nodeRef: createRef(),
  },
  {
    type: 'order',
    name: 'Order',
    nodeRef: createRef(),
  },
];

const AddWrapper = styled.div`
  display: flex;
`;

const AddButton = styled(Button)`
  flex: 1;
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing-tiny) * 1.5) 0;
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: () => void;
}

const ListItem = styled.li`
  list-style: none;
  &:not(:last-child) {
    padding-bottom: var(--spacing-base);
  }

  &.resource-list-enter {
    max-height: 0;
    height: auto;
    overflow-y: hidden;
    transition: max-height 0.3s ease-out;
  }
  &.resource-list-enter-active {
    overflow-y: hidden;
    transition: max-height 0.3s ease-out;
    height: auto;
    max-height: 600px;
  }
  &.resource-list-exit {
    overflow-y: hidden;
    transition: max-height 0.3s ease-out;
    height: auto;
    max-height: 600px;
  }
  &.resource-list-exit-active {
    max-height: 0;
    height: auto;
    overflow-y: hidden;
    transition: max-height 0.3s ease-out;
  }
`;

const ResourceAdd = ({ onAdd }: AddProps) => {
  return (
    <AddWrapper>
      <AddButton onClick={onAdd}>
        Add resource <AddIcon size={18 * 1.2} />
      </AddButton>
    </AddWrapper>
  );
};

const ResourceList = () => {
  const [values, setValues] = useState<Resource[]>(resources);
  const onChange = (idx: number) => (resource: Resource) => {
    setValues([...values.slice(0, idx), resource, ...values.slice(idx + 1)]);
  };
  const onDelete = (idx: number) => () => {
    setValues([...values.slice(0, idx), ...values.slice(idx + 1)]);
  };
  const onAdd = () => {
    setValues([...values, { nodeRef: createRef() }]);
  };

  return (
    <TransitionGroup component="ul">
      {[
        ...values.map((r, i) => (
          <CSSTransition
            key={i}
            nodeRef={r.nodeRef}
            timeout={280}
            classNames="resource-list"
          >
            <ListItem ref={r.nodeRef}>
              <ResourceCard
                key={i}
                resource={r}
                onChange={onChange(i)}
                onDelete={onDelete(i)}
                onMaximise={() => console.log(i)}
              ></ResourceCard>
            </ListItem>
          </CSSTransition>
        )),
        // This won't animate, but causes errors without it
        <CSSTransition key="add" timeout={280} classNames="resource-list">
          <ListItem>
            <ResourceAdd onAdd={onAdd} />
          </ListItem>
        </CSSTransition>,
      ]}
    </TransitionGroup>
  );
};

export default ResourceList;
