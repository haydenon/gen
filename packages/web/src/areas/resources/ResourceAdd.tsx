import { v4 as uuid } from 'uuid';
import { ResourceResponse } from '@haydenon/gen-server';
import { PlusCircle } from 'react-feather';
import styled from 'styled-components';
import { Menu, MenuComboList } from '../../components/Menu/Menu';
import { DesiredResource } from './desired-resources/desired-resource';
import { useMemo } from 'react';

interface ResourceChooserProps {
  resources: ResourceResponse[];
  onResourceSelect: (type: string) => void;
}

const ResourceChooser = ({
  onResourceSelect,
  resources,
}: ResourceChooserProps) => {
  const resourceNames = useMemo(
    () => resources.map((r) => r.name),
    [resources]
  );

  return (
    <Menu
      label={() => (
        <AddButton>
          Add resource <AddIcon size={18 * 1.2} />
        </AddButton>
      )}
      $composite={false}
    >
      <MenuComboList list={resourceNames} onItemSelect={onResourceSelect} />
    </Menu>
  );
};

const AddWrapper = styled.div`
  display: flex;
`;

const AddButton = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
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
