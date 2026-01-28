import { useMemo } from 'react';
import { Link2, Trash2 } from 'react-feather';
import styled from 'styled-components';
import Button, { ButtonColour, ButtonStyle } from '../../../components/Button';
import { Menu, MenuItem } from '../../../components/Menu/Menu';
import { NonFormLabel } from '../../../components/Label';
import VisuallyHidden from '../../../components/VisuallyHidden';
import CodeText from '../../../components/CodeText';
import { useDesiredResources } from '../desired-resources/desired-resource.hook';

interface Props {
  currentResourceId: string;
  dependentOnStateIds: string[];
  onChange: (dependentIds: string[]) => void;
}

const Container = styled.div`
  margin-top: var(--spacing-base);
`;

const List = styled.ol`
  margin-top: var(--spacing-tiny);
  border-left: 4px solid var(--colors-contentBackground-light-disabled);
  padding-left: var(--spacing-base);
  list-style: none;
`;

const ListItem = styled.li`
  padding: var(--spacing-tiny) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-small);

  &:not(:first-child) {
    border-top: 1px solid var(--colors-border);
    margin-top: var(--spacing-tiny);
  }
`;

const SmallText = styled.div`
  padding: var(--spacing-tiny) 0;
  font-size: var(--typography-size-small);
  border-left: 4px solid var(--colors-contentBackground-light-disabled);
  padding-left: 16px;
`;

const Actions = styled.div`
  display: flex;
  gap: var(--spacing-tiny);
  align-items: center;
`;

const DependentStateInput = ({
  currentResourceId,
  dependentOnStateIds,
  onChange,
}: Props) => {
  const { desiredResources } = useDesiredResources();
  const resources = desiredResources.value ?? [];

  const availableResources = useMemo(() => {
    return resources.filter(
      (r) =>
        r.id !== currentResourceId &&
        r.name &&
        !dependentOnStateIds.includes(r.id)
    );
  }, [resources, currentResourceId, dependentOnStateIds]);

  const selectedResources = useMemo(() => {
    return dependentOnStateIds
      .map((id) => resources.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined && r.name !== undefined);
  }, [dependentOnStateIds, resources]);

  const handleAdd = (resourceId: string) => {
    onChange([...dependentOnStateIds, resourceId]);
  };

  const handleRemove = (resourceId: string) => {
    onChange(dependentOnStateIds.filter((id) => id !== resourceId));
  };

  return (
    <Container>
      <NonFormLabel label="Dependent on States">
        <Actions>
          <Menu
            $buttonStyle={ButtonStyle.Icon}
            label={() => <Link2 size={18} />}
          >
            {availableResources.length === 0 ? (
              <SmallText>No available named states</SmallText>
            ) : (
              availableResources.map((r) => (
                <MenuItem
                  key={r.id}
                  label={
                    <>
                      <div>{r.name}</div>
                      <SmallText>{r.type}</SmallText>
                    </>
                  }
                  onClick={() => handleAdd(r.id)}
                />
              ))
            )}
          </Menu>
        </Actions>
        {selectedResources.length > 0 ? (
          <List>
            {selectedResources.map((r) => (
              <ListItem key={r.id}>
                <CodeText>{r.name}</CodeText>
                <SmallText>{r.type}</SmallText>
                <Button
                  buttonStyle={ButtonStyle.Icon}
                  colour={ButtonColour.Danger}
                  onClick={() => handleRemove(r.id)}
                >
                  <VisuallyHidden>Remove dependency</VisuallyHidden>
                  <Trash2 size={16} strokeWidth={3} />
                </Button>
              </ListItem>
            ))}
          </List>
        ) : (
          <SmallText>No state dependencies</SmallText>
        )}
      </NonFormLabel>
    </Container>
  );
};

export default DependentStateInput;
