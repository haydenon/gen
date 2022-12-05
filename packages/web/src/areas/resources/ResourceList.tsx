import { useState } from 'react';
import { PlusCircle } from 'react-feather';

import styled from 'styled-components';
import Button from '../../components/Button';
import ResourceCard from './ResourceCard';

export interface Resource {
  type?: string;
  name?: string;
}
const resources: Resource[] = [
  {
    type: 'product',
    name: 'SomeProduct',
  },
  {
    type: 'product',
    name: 'OtherProduct',
  },
  {
    type: 'service',
    name: 'SomeService',
  },
  {
    type: 'member',
    name: 'SomeMember',
  },
  {
    type: 'order',
    name: 'Order',
  },
];

const AddWrapper = styled.div`
  display: flex;
`;

const AddButton = styled(Button)`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: () => void;
}

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
    setValues([...values, {}]);
  };
  return (
    <div>
      {values.map((r, i) => (
        <ResourceCard
          key={i}
          resource={r}
          onChange={onChange(i)}
          onDelete={onDelete(i)}
        ></ResourceCard>
      ))}
      <ResourceAdd onAdd={onAdd} />
    </div>
  );
};

export default ResourceList;
