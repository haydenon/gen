import { v4 as uuid } from 'uuid';
import { ResourceResponse } from '@haydenon/gen-server';
import { PlusCircle, Zap } from 'react-feather';
import styled from 'styled-components';
import { Menu, MenuComboList } from '../../components/Menu/Menu';
import { DesiredResource } from './desired-resources/desired-resource';
import { useMemo, useState, useCallback } from 'react';
import AIGenerationModal from '../../components/AIGenerationModal';
import Button from '../../components/Button/Button';
import { useEnvironments } from '../environments/environment.hook';
import { deserializeScenario } from './scenario-serialization';

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
  gap: var(--spacing-small);
`;

const AddButton = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

const AIIcon = styled(Zap)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: (res: DesiredResource) => void;
  onAddMultiple: (resources: DesiredResource[]) => void;
  onClearAll?: () => void;
  resources: ResourceResponse[];
}

const ResourceAdd = ({
  onAdd,
  onAddMultiple,
  onClearAll,
  resources,
}: AddProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentEnvironment } = useEnvironments();

  const handleGenerate = useCallback(
    async (prompt: string, replaceMode: boolean) => {
      if (!currentEnvironment) {
        throw new Error('No environment selected');
      }

      const response = await fetch('/v1/generate-scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioPrompt: prompt,
          environment: currentEnvironment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message || 'Failed to generate scenario';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Clear existing resources if in replace mode
      if (replaceMode && onClearAll) {
        onClearAll();
      }

      // Add generated resources
      if (data.resources && data.resources.length > 0) {
        const newResources = deserializeScenario({ resources: data.resources });
        onAddMultiple(newResources);
      }

      // Log errors if any
      if (data.errors && data.errors.length > 0) {
        console.error('AI generation warnings:', data.errors);
      }
    },
    [currentEnvironment, onAddMultiple, onClearAll]
  );

  return (
    <>
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
        <Button onClick={() => setIsModalOpen(true)}>
          AI Generate <AIIcon size={18} />
        </Button>
      </AddWrapper>

      <AIGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        environment={currentEnvironment || ''}
      />
    </>
  );
};

export default ResourceAdd;
