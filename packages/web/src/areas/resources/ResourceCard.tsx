import styled from 'styled-components';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { Resource } from './ResourceList';

interface Props {
  resource: Resource;
  onChange: (resource: Resource) => void;
}

const typeMap: { [type: string]: string } = {
  product: 'Product',
  service: 'Service',
  member: 'Member',
  order: 'Order',
};

const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: var(--spacing-small);
`;

const ResourceCard = ({ resource, onChange }: Props) => {
  const onTypeChange = (type: string) =>
    onChange({
      ...resource,
      type,
    });

  const onNameChange = (name: string) => onChange({ ...resource, name });

  return (
    <Card>
      <Header>
        <Select label="Type" value={resource.type} onChange={onTypeChange}>
          {Object.keys(typeMap).map((key, i) => (
            <option value={key} key={key}>
              {typeMap[key]}
            </option>
          ))}
        </Select>
        <Input
          placeholder="SomePerson"
          value={resource.name}
          onChange={onNameChange}
        />
      </Header>

      {typeMap[resource.type]}
      <br />
      {resource.name}
    </Card>
  );
};

export default ResourceCard;
