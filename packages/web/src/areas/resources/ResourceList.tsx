import { useState } from 'react';
import ResourceCard from './ResourceCard';

export interface Resource {
  type: string;
  name: string;
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

const ResourceList = () => {
  const [values, setValues] = useState<Resource[]>(resources);
  const onChange = (idx: number) => (resource: Resource) => {
    setValues([...values.slice(0, idx), resource, ...values.slice(idx + 1)]);
  };
  return (
    <div>
      {values.map((r, i) => (
        <ResourceCard
          key={i}
          resource={r}
          onChange={onChange(i)}
        ></ResourceCard>
      ))}
    </div>
  );
};

export default ResourceList;
