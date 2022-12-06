import { AnimatePresence, motion } from 'framer-motion';
import { createRef, useState } from 'react';
import { PlusCircle } from 'react-feather';

import styled from 'styled-components';
import Button from '../../components/Button';
import ResourceCard from './ResourceCard';

export interface Resource {
  id: number;
  type?: string;
  name?: string;
  nodeRef: React.RefObject<any>;
}
let resourceId = 1;

const resources: Resource[] = [
  {
    id: resourceId++,
    type: 'product',
    name: 'SomeProduct',
    nodeRef: createRef(),
  },
  {
    id: resourceId++,
    type: 'product',
    name: 'OtherProduct',
    nodeRef: createRef(),
  },
  {
    id: resourceId++,
    type: 'service',
    name: 'SomeService',
    nodeRef: createRef(),
  },
  {
    id: resourceId++,
    type: 'member',
    name: 'SomeMember',
    nodeRef: createRef(),
  },
  {
    id: resourceId++,
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

const ListItem = styled(motion.li)`
  list-style: none;
  &:not(:last-child) {
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
  const [enterAnimations, setEnterAnimations] = useState(false);
  const onChange = (idx: number) => (resource: Resource) => {
    setValues([...values.slice(0, idx), resource, ...values.slice(idx + 1)]);
  };
  const onDelete = (idx: number) => () => {
    setValues([...values.slice(0, idx), ...values.slice(idx + 1)]);
  };
  const onAdd = () => {
    setEnterAnimations(true);
    setValues([
      ...values,
      {
        id: resourceId++,
        nodeRef: createRef(),
      },
    ]);
  };

  return (
    <ul>
      <AnimatePresence>
        {[
          ...values.map((r, i) => (
            <ListItem
              key={r.id}
              ref={r.nodeRef}
              initial={
                enterAnimations ? { height: '0px', overflowY: 'hidden' } : false
              }
              animate={{
                height: 'unset',
                overflowY: 'unset',
              }}
              exit={{
                height: '0px',
                overflowY: 'hidden',
              }}
            >
              <ResourceCard
                resource={r}
                onChange={onChange(i)}
                onDelete={onDelete(i)}
                onMaximise={() => console.log(i)}
              ></ResourceCard>
            </ListItem>
          )),
          <ListItem key="add">
            <ResourceAdd onAdd={onAdd} />
          </ListItem>,
        ]}
      </AnimatePresence>
    </ul>
  );
};

export default ResourceList;
