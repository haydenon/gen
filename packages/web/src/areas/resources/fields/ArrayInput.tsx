import { ArrayTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';
import Label from '../../../components/Label';
import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: ArrayTypeResponse;
  value: any[] | undefined | null;
  onChange: (value: any[] | undefined | null) => void;
}

const List = styled.ol`
  padding-top: var(--spacing-tiny);
  padding-left: var(--spacing-large);
`;

const ListItem = styled.li`
  list-style: none;
  position: relative;
  padding-bottom: var(--spacing-small);

  &::before {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--colors-text);
    margin-right: 0.4rem;
    position: absolute;
    left: -1.2rem;
    top: 2rem;
  }
`;

const FieldLabel = styled(Label)`
  margin-top: calc(-1 * var(--labelOffset));
`;

const ListText = styled.div`
  font-size: var(--typography-size-paragraph);
`;

const ArrayInput = ({
  type,
  value,
  name,
  context,
  onChange,
  parentActions,
}: Props) => {
  if (!(value instanceof Array)) {
    // return <p>No array items</p>
    value = [182, 789];
  }
  return (
    <FieldLabel label={name}>
      {parentActions}
      <List>
        {value.map((item, i) => (
          <ListItem key={i}>
            <InputForType
              type={type.inner}
              value={item}
              name={`[${i}]`}
              onChange={() => {}} // TODO: On change for arrays
              context={context}
              parentActions={null}
            />
          </ListItem>
        ))}
      </List>
    </FieldLabel>
  );
};

export default ArrayInput;
