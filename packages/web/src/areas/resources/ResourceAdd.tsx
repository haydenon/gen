import { v4 as uuid } from 'uuid';
import { ResourceResponse } from '@haydenon/gen-server';
// import { MenuPopover } from '@reach/menu-button';
import { PlusCircle } from 'react-feather';
import styled from 'styled-components';
import { Menu, MenuComboList, MenuItem } from '../../components/NewMenu/Menu';
import { DesiredResource } from './desired-resources/desired-resource';
import { ButtonColour } from '../../components/Button';
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  useComboboxState,
} from 'ariakit';
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
  // const combobox = useComboboxState({
  //   list: resourceNames,
  //   open: true,
  // });

  return (
    <Menu
      label={
        <AddButton>
          Add resource <AddIcon size={18 * 1.2} />
        </AddButton>
      }
      composite={false}
      // onClose={() => combobox.setValue('')}
    >
      <MenuComboList list={resourceNames} onItemSelect={onResourceSelect} />
      {/* <Combobox
        state={combobox}
        autoSelect
        placeholder="Search..."
        className="combobox"
        autoFocus={true}
      />
      <ComboboxList state={combobox} className="combobox-list">
        {combobox.matches.map((value, i) => (
          <ComboboxItem
            as={MenuItem}
            label={value}
            key={value + i}
            value={value}
            focusOnHover
            setValueOnClick={false}
            className="menu-item"
            onClick={() => {
              onResourceSelect(value);
            }}
            clickOnSpace={true}
            clickOnEnter={true}
          />
        ))}
      </ComboboxList> */}
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
