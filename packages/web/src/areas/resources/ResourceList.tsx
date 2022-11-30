import Card from '../../components/Card';
import Select from '../../components/Select';

interface Resource {
  type: string;
  name: string;
}
const resources: Resource[] = [
  {
    type: 'Product',
    name: 'SomeProduct',
  },
  {
    type: 'Product',
    name: 'OtherProduct',
  },
  {
    type: 'Service',
    name: 'SomeService',
  },
  {
    type: 'Member',
    name: 'SomeMember',
  },
  {
    type: 'Order',
    name: 'Order',
  },
];

const ResourceList = () => {
  return (
    <div>
      {resources.map((r) => (
        <Card key={r.name}>
          <Select label="Type" value="A">
            <option>A</option>
          </Select>
          {r.type}
          <br />
          {r.name}
        </Card>
      ))}
    </div>
  );
};

export default ResourceList;
