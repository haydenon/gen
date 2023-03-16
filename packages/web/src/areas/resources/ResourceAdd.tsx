import { ResourceResponse } from '@haydenon/gen-server';
import { MenuPopover } from '@reach/menu-button';
import { positionMatchWidth, positionRight } from '@reach/popover';
import { useEffect, useRef, useState } from 'react';
import { PlusCircle } from 'react-feather';
import styled from 'styled-components';
import Input from '../../components/Input';
import {
  Menu,
  MenuItem,
  MenuItems,
  MenuButton,
} from '../../components/Menu/Menu';

interface ResourceChooserProps {
  resources: ResourceResponse[];
  onResourceSelect: (type: string) => void;
}

interface SearchProps {
  open: boolean;
}

const SearchInput = ({ open }: SearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef, open]);
  return <Input ref={inputRef} label="Search" onChange={console.log}></Input>;
};

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
            {/* <SearchInput open={false} /> */}
            {resources.map((res) => (
              <MenuItem key={res.name} onSelect={console.log}>
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
  onAdd: () => void;
  resources: ResourceResponse[];
}

const ResourceAdd = ({ onAdd, resources }: AddProps) => {
  return (
    <AddWrapper>
      <ResourceChooser onResourceSelect={console.log} resources={resources} />
    </AddWrapper>
  );
};

export default ResourceAdd;
