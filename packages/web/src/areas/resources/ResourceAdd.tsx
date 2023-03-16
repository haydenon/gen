import { v4 as uuid } from 'uuid';
import { ResourceResponse } from '@haydenon/gen-server';
import { MenuPopover } from '@reach/menu-button';
import { PlusCircle } from 'react-feather';
import styled from 'styled-components';
import {
  Menu,
  MenuItem,
  MenuItems,
  MenuButton,
} from '../../components/Menu/Menu';
import { DesiredResource } from './desired-resources/desired-resource';

interface ResourceChooserProps {
  resources: ResourceResponse[];
  onResourceSelect: (type: string) => void;
}

const ResourceChooser = ({
  onResourceSelect,
  resources,
}: ResourceChooserProps) => {
  return (
    <Menu>
      <>
        <AddButton>
          Add resource <AddIcon size={18 * 1.2} />
        </AddButton>
        <MenuPopover portal={true}>
          <MenuItems>
            {resources.map((res) => (
              <MenuItem
                key={res.name}
                onSelect={() => onResourceSelect(res.name)}
              >
                <div>{res.name}</div>
              </MenuItem>
            ))}
          </MenuItems>
        </MenuPopover>
      </>
    </Menu>
  );
};

const AddWrapper = styled.div`
  display: flex;
`;

const AddButton = styled(MenuButton)`
  flex: 1;
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing-tiny) * 1.5) 0;
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: (res: DesiredResource) => void;
  resources: ResourceResponse[];
}

const ResourceAdd = ({ onAdd, resources }: AddProps) => {
  return (
    <AddWrapper>
      <ResourceChooser
        onResourceSelect={(type) =>
          onAdd({
            id: uuid(),
            type,
            fieldData: {},
          })
        }
        resources={resources}
      />
    </AddWrapper>
  );
};

export default ResourceAdd;
