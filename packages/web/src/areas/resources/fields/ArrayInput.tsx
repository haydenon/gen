import { ArrayTypeResponse } from '@haydenon/gen-server';
import { useMemo } from 'react';
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
  margin-top: var(--spacing-tiny);
  border-left: 4px solid var(--colors-contentBackground-light-disabled);
  padding-left: var(--spacing-base);
`;

interface ListItemProps {
  index: number;
}

const ListItem = styled.li<ListItemProps>`
  list-style: none;
  position: relative;
  padding-bottom: var(--spacing-tiny);

  display: flex;
  gap: var(--spacing-tiny);
  --li-spacing: 0px;

  &:not(:first-child) {
    border-top: 1px solid var(--colors-border);
    margin-top: 8px;
    --li-spacing: var(--spacing-tiny);
  }

  padding-top: var(--li-spacing);

  &::before {
    content: '[${(props) => props.index}]';
    position: absolute;
    left: calc(
      -1 * (var(--spacing-large)
            ${(props) => (props.index < 10 ? '+ 5px' : '+ 9px')})
    );
    top: calc(3px + var(--content-padding) + var(--li-spacing));
    font-family: monospace;
    font-weight: 500;
    font-size: var(--typography-size-small);
    background: var(--colors-contentBackground);
  }
`;

const FieldLabel = styled(NonFormLabel)`
  margin-top: ${(props) =>
    props.label ? 'calc(-1 * var(--labelOffset))' : 'unset'};
`;

const Actions = styled.div`
  display: flex;
  gap: var(--spacing-tiny);
`;

const SmallText = styled.div`
  padding: var(--spacing-tiny) 0;
  font-size: var(--typography-size-small);
  border-left: 4px solid var(--colors-contentBackground-light-disabled);
  padding-left: 16px;
`;

const ArrayInput = ({
  type,
  value,
  name,
  context,
  onChange,
  parentActions,
  errors,
}: Props) => {
  const contextByIndex = useMemo(
    () =>
      value.map((_, idx) => ({
        ...context,
        currentPath: [...context.currentPath, idx.toString()],
      })),
    [context, value]
  );
  const errorsByIndex = useMemo(
    () =>
      value.map((_, idx) =>
        errors.filter((err) => {
          const path = contextByIndex[idx].currentPath;
          return path.every((p, idx) => err.path[idx] === p);
        })
      ),
    [errors, value, contextByIndex]
  );

  const children = (
    <>
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
              name={null}
              onChange={(childValue) =>
                onChange([
                  ...value.slice(0, i),
                  childValue,
                  ...value.slice(i + 1),
                ])
              }
              context={contextByIndex[i]}
              errors={errorsByIndex[i]}
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
    </>
  );
  return <FieldLabel label={name ?? ''}>{children}</FieldLabel>;
};

export default ArrayInput;
