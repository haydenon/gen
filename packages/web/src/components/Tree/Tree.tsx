import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';

import styled from 'styled-components';

import Label from '../Label';
import { Select, SelectItem, SelectPopover, useSelectState } from 'ariakit';
import { ChevronLeft } from 'react-feather';
import { baseInputStyles } from '../Input/Input';
import { menuItemStyles, menuStyles } from '../Menu/Menu';
import { isParent, TreeNode } from '@haydenon/gen-core';

interface TreeProps {
  label: string | undefined;
  tree: TreeNode<any>;
  value?: string;
  onChange: (value: string) => void;
}

const SelectInput = styled(Select)`
  ${baseInputStyles}

  &:focus,
  &:focus-visible {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }

  svg {
    display: none;
  }

  margin-bottom: var(--spacing-tiny);
`;

const SelectList = styled(SelectPopover)`
  overflow-y: auto;
  z-index: 2;

  ${menuStyles}
`;

const SelectValue = styled(SelectItem)`
  ${menuItemStyles}

  position: relative;
  min-width: 200px;
`;

interface TreeState {
  path: string[];
  parent?: TreeState;
  node: TreeNode<any>;
  children: TreeNode<any>[];
}

function addNodeTreeState(
  map: Map<TreeNode<any>, TreeState>,
  parent: TreeState | undefined,
  node: TreeNode<any>,
  path: string[]
): void {
  if (isParent(node)) {
    const newPath = [...path, node.name];
    const state = {
      path: newPath,
      display: node.name,
      parent,
      node,
      children: node.children,
    };
    map.set(node, state);
    for (const child of node.children) {
      addNodeTreeState(map, state, child, newPath);
    }
  } else {
    map.set(node, parent!);
  }
}

let debounceClose = false;
let settingValue = false;

const BackIcon = styled(ChevronLeft)`
  position: absolute;
  top: 11px;
  left: -2px;
  width: 16px;
  height: 16px;
`;

const Breadcrumbs = styled.span`
  font-size: var(--typography-size-small);
  display: block;
  padding: var(--spacing-extraTiny);
`;

const Tree = ({ label, value, onChange, tree }: TreeProps) => {
  const valueToTreeNode: Map<string, TreeNode<any>> = useMemo(() => {
    const map = new Map();
    const addValues = (node: TreeNode<any>) => {
      if (isParent(node)) {
        map.set(node.value, node);
        for (const child of node.children) {
          addValues(child);
        }
      } else {
        map.set(node.value, node);
      }
    };
    addValues(tree);
    return map;
  }, [tree]);
  const leaves: any[] = useMemo(() => {
    const leafValues: any[] = [];
    const addLeafValues = (node: TreeNode<any>) => {
      if (isParent(node)) {
        for (const child of node.children) {
          addLeafValues(child);
        }
      } else {
        leafValues.push(node.value);
      }
    };
    addLeafValues(tree);
    return leafValues;
  }, [tree]);
  const selectionToTreeState: Map<TreeNode<any>, TreeState> = useMemo(() => {
    const map = new Map();
    addNodeTreeState(map, undefined, tree, []);
    return map;
  }, [tree]);

  const [selectValue, setSelectValue] = useState<string>(
    value ?? tree.value?.toString()
  );
  const [open, setOpen] = useState<boolean>(false);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement> | string) => {
      let setValue: string;
      if (typeof event === 'string') {
        setValue = event;
      } else {
        setValue = event.target.value;
      }

      if (leaves.includes(setValue)) {
        settingValue = true;
        onChange(setValue);
      } else {
        debounceClose = true;
      }

      setSelectValue(setValue);
    },
    [setSelectValue, leaves, onChange]
  );
  const baseState = {
    setOpen: (shouldOpen: boolean) => {
      if (!shouldOpen && debounceClose) {
        debounceClose = false;
      } else {
        if (!shouldOpen) {
          if (!settingValue) {
            setSelectValue(value ?? tree.value?.toString());
          } else {
            settingValue = false;
          }
        }
        setOpen(shouldOpen);
      }
    },
    open,
  };

  const select = useSelectState({
    ...baseState,
    setValue: handleChange,
    value: value ?? '(none selected)',
    gutter: 8,
  });

  const state = selectionToTreeState.get(
    selectValue ? valueToTreeNode.get(selectValue)! : tree
  )!;

  return (
    <>
      {label !== undefined ? (
        <Label label={label}>
          <SelectInput state={select} />
        </Label>
      ) : (
        <SelectInput state={select} />
      )}
      <SelectList state={select}>
        {state.path.length ? (
          <Breadcrumbs>{state.path.slice(1).join(' / ')}</Breadcrumbs>
        ) : null}
        {state.parent ? (
          <SelectValue
            key={state.parent.node.name}
            value={state.parent.node.value}
          >
            <BackIcon /> Back
          </SelectValue>
        ) : null}
        {state.children.map((opt) => (
          <SelectValue key={opt.name} value={opt.value}>
            {opt.name}
          </SelectValue>
        ))}
      </SelectList>
    </>
  );
};

export default Tree;
