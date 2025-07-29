import { OffsetWrapper } from './FieldInput';

import { BaseInputProps } from './props';
import Tree from '../../../components/Tree';
import { TreeNode } from '@haydenon/gen-core';

interface Props extends BaseInputProps {
  tree: TreeNode<any>;
  value: any;
  onChange: (value: string) => void;
}

const TreeInput = ({ onChange, value, tree, parentActions, name }: Props) => {
  return (
    <>
      <OffsetWrapper offset={name !== null}>
        <Tree
          label={name ?? ''}
          value={value?.toString()}
          tree={tree}
          onChange={onChange}
        />
      </OffsetWrapper>
      {parentActions}
    </>
  );
};

export default TreeInput;
