import styled from 'styled-components';
import { Trash2 } from 'react-feather';

import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { Resource } from './ResourceList';
import Button, { ButtonStyle } from '../../components/Button';
import VisuallyHidden from '../../components/VisuallyHidden';

interface Props {
  resource: Resource;
  onChange: (resource: Resource) => void;
  onDelete: () => void;
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

const DeleteWrapper = styled.div`
  margin-left: auto;
`;

const DeleteIcon = styled(Trash2)`
  color: var(--colors-text-danger);
  transition: color var(--transition-duration-font);
`;

const ResourceCard = ({ resource, onChange, onDelete }: Props) => {
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
          value={resource.name ?? ''}
          onChange={onNameChange}
        />
        <DeleteWrapper>
          <Button style={ButtonStyle.Icon} onClick={onDelete}>
            <VisuallyHidden>Delete desired state entry</VisuallyHidden>
            <DeleteIcon size={16} strokeWidth={3} />
          </Button>
        </DeleteWrapper>
      </Header>

      {resource.type ? typeMap[resource.type] : '(type not selected)'}
      <br />
      {resource.name ?? '(no name)'}
    </Card>
  );
};

export default ResourceCard;
