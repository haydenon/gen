import { ArrayTypeResponse } from '@haydenon/gen-server';
import { Plus, Trash2 } from 'react-feather';
import styled from 'styled-components';
import Button, { ButtonColour, ButtonStyle } from '../../../components/Button';
import { NonFormLabel } from '../../../components/Label';
import VisuallyHidden from '../../../components/VisuallyHidden';
import { generateDefaultValue } from '../../../utilities/default-value.generator';
import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: ArrayTypeResponse;
  value: any[];
  onChange: (value: any[]) => void;
}

const List = styled.ol`
  /* padding-left: var(--spacing-extraLarge); */
  margin-top: var(--spacing-tiny);
  border-left: 4px solid var(--colors-text);
  padding-left: 16px;
`;

interface ListItemProps {
  index: number;
}

const ListItem = styled.li<ListItemProps>`
  list-style: none;
  position: relative;
  padding-bottom: var(--spacing-small);
  padding-top: var(--labelOffset);

  display: flex;
  gap: var(--spacing-tiny);

  &::before {
    content: '[${(props) => props.index}]';
    position: absolute;
    left: calc(-1 * var(--spacing-large));
    top: calc(var(--labelOffset) + var(--content-padding));
    font-family: monospace;
    font-weight: 500;
    font-size: 0.75rem;
    background: var(--colors-contentBackground);
  }
`;

const FieldLabel = styled(NonFormLabel)`
  margin-top: calc(-1 * var(--labelOffset));
  /* border-left: 4px solid var(--colors-text); */
  /* padding-left: 16px; */
  /* margin-left: -20px; */
`;

const Actions = styled.div`
  display: flex;
  gap: var(--spacing-tiny);
`;

const SmallText = styled.div`
  padding-top: var(--spacing-small);
  font-size: var(--typography-size-small);
`;

const ArrayInput = ({
  type,
  value,
  name,
  context,
  onChange,
  parentActions,
}: Props) => {
  return (
    <FieldLabel label={name}>
      <Actions>
        <Button
          buttonStyle={ButtonStyle.Icon}
          colour={ButtonColour.Success}
          onClick={() => onChange([...value, generateDefaultValue(type.inner)])}
        >
          <VisuallyHidden>Add array item</VisuallyHidden>
          <Plus size={16} strokeWidth={3} />
        </Button>
        {parentActions}
      </Actions>
      <List>
        {value.map((item, i) => (
          <ListItem index={i} key={i}>
            <InputForType
              type={type.inner}
              value={item}
              name={`Item ${i}`}
              onChange={(childValue) =>
                onChange([
                  ...value.slice(0, i),
                  childValue,
                  ...value.slice(i + 1),
                ])
              }
              context={context}
              parentActions={
                <Button
                  buttonStyle={ButtonStyle.Icon}
                  colour={ButtonColour.Danger}
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                >
                  <VisuallyHidden>Remove array item</VisuallyHidden>
                  <Trash2 size={16} strokeWidth={3} />
                </Button>
              }
            />
          </ListItem>
        ))}
      </List>
      {value.length < 1 ? <SmallText>No array items</SmallText> : null}
    </FieldLabel>
  );
};

export default ArrayInput;
