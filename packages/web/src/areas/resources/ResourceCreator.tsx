import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { List, Save, Upload, Download } from 'react-feather';
import Button, { ButtonColour } from '../../components/Button';
import FullWidthWrapper from '../../components/FullWidthWrapper';
import { useDesiredResources } from './desired-resources/desired-resource.hook';
import { useScenarioLibrary } from './desired-resources/scenario-library.hook';
import ResourceList from './ResourceList';
import ResourceCreationOutput from './output/ResourceCreationOutput';
import Loader from '../../components/Loader';
import { useEnvironments } from '../environments/environment.hook';
import SaveScenarioModal from '../../components/SaveScenarioModal';
import ScenarioLibraryModal from '../../components/ScenarioLibraryModal';
import { serializeScenario, deserializeScenario } from './scenario-serialization';

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Contents = styled.div`
  flex: 1;
  display: grid;

  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);

  gap: var(--spacing-extraLarge);
`;

interface BarProps {
  isSticky: boolean;
  isModalMaximised: boolean;
}

const ActionBarPlaceholder = styled.div`
  height: calc(
    1rem * var(--typography-lineHeight) + (var(--spacing-large) * 2)
  );
`;

const ActionBar = styled.div<BarProps>`
  top: -1px;
  background-color: var(--colors-background);
  z-index: 1;
  padding: calc(var(--spacing-tiny) + 1px) 0 var(--spacing-tiny) 0;
  width: 100%;
  box-shadow: ${(props) =>
    props.isSticky ? '0px 2px 2px 0px var(--colors-shadow)' : 'unset'};

  position: ${(props) =>
    props.isSticky ? (props.isModalMaximised ? 'fixed' : 'sticky') : 'unset'};
`;

interface HeaderProps {
  children: React.ReactNode | React.ReactNode[];
  isModalMaximised: boolean;
}

const ActionHeader = ({ children, isModalMaximised }: HeaderProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentRef = ref?.current;

  // mount
  useEffect(() => {
    if (!currentRef) {
      return;
    }

    const cachedRef = currentRef,
      observer = new IntersectionObserver(
        ([e]) => setIsSticky(e.intersectionRatio < 1),
        {
          threshold: [1],
        }
      );

    observer.observe(cachedRef);

    // unmount
    return function () {
      observer.unobserve(cachedRef);
    };
  }, [currentRef]);

  return (
    <>
      {isSticky && isModalMaximised ? (
        <ActionBarPlaceholder></ActionBarPlaceholder>
      ) : null}
      <ActionBar
        isModalMaximised={isModalMaximised}
        isSticky={isSticky}
        ref={ref}
      >
        {children}
      </ActionBar>
    </>
  );
};

const HeaderContents = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftActions = styled.div`
  display: flex;
  gap: var(--spacing-small);
`;

const RightActions = styled.div`
  display: flex;
  gap: var(--spacing-small);
`;

const CreateButton = styled(Button)`
  display: flex;
  align-items: center;
`;

const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: var(--spacing-tiny);
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

const ContentWrapper = styled(FullWidthWrapper)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: var(--spacing-large);
`;

const ResourceCreator = () => {
  const { currentEnvironment } = useEnvironments();
  const {
    desiredResources,
    createDesiredState,
    isCreating,
    creatingState,
    setDesiredResources,
  } = useDesiredResources();
  const [maximised, setMaximised] = useState(false);

  const resources = useMemo(
    () => desiredResources?.value ?? [],
    [desiredResources]
  );

  const scenarioLibrary = useScenarioLibrary(resources);

  // Modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save scenario handler
  const handleSaveScenario = useCallback(
    async (title: string, description: string) => {
      await scenarioLibrary.saveScenario(title, description);
    },
    [scenarioLibrary]
  );

  // Load scenario handler
  const handleLoadScenario = useCallback(
    async (id: string) => {
      const loadedResources = await scenarioLibrary.loadScenario(id);
      setDesiredResources(loadedResources);
    },
    [scenarioLibrary, setDesiredResources]
  );

  // Import scenario from file
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          // Check if it's a SavedScenario format (with scenario.resources)
          const scenarioData = parsed.scenario
            ? parsed.scenario
            : parsed.resources
            ? parsed
            : null;

          if (!scenarioData || !Array.isArray(scenarioData.resources)) {
            throw new Error('Invalid scenario file format');
          }

          const loadedResources = deserializeScenario(scenarioData);
          setDesiredResources(loadedResources);
        } catch (err) {
          const error = err as Error;
          alert(`Failed to import scenario: ${error.message}`);
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be selected again
      event.target.value = '';
    },
    [setDesiredResources]
  );

  // Export scenario to file
  const handleExport = useCallback(() => {
    try {
      const scenarioData = serializeScenario(resources);

      // Wrap in SavedScenario format
      const savedScenario = {
        id: 'temp-' + Date.now(),
        title: 'Exported Scenario',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenario: scenarioData,
      };

      const blob = new Blob([JSON.stringify(savedScenario, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `scenario-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const error = err as Error;
      alert(`Failed to export scenario: ${error.message}`);
    }
  }, [resources]);

  return (
    <Wrapper>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileSelect}
      />

      <ActionHeader isModalMaximised={maximised}>
        <FullWidthWrapper>
          <HeaderContents>
            <LeftActions>
              {scenarioLibrary.isEnabled && (
                <>
                  <ActionButton onClick={() => setIsLibraryModalOpen(true)}>
                    <IconWrapper>
                      <List size={18} />
                    </IconWrapper>
                    Scenarios
                  </ActionButton>
                  <ActionButton
                    onClick={() => setIsSaveModalOpen(true)}
                    disabled={resources.length === 0}
                  >
                    <IconWrapper>
                      <Save size={18} />
                    </IconWrapper>
                    Save
                  </ActionButton>
                </>
              )}
              <ActionButton onClick={handleImport}>
                <IconWrapper>
                  <Upload size={18} />
                </IconWrapper>
                Import
              </ActionButton>
              <ActionButton onClick={handleExport} disabled={resources.length === 0}>
                <IconWrapper>
                  <Download size={18} />
                </IconWrapper>
                Export
              </ActionButton>
            </LeftActions>
            <RightActions>
              <CreateButton
                onClick={createDesiredState}
                colour={ButtonColour.Success}
                disabled={isCreating || currentEnvironment === undefined}
              >
                Create
                {isCreating ? <Loader /> : null}
              </CreateButton>
            </RightActions>
          </HeaderContents>
        </FullWidthWrapper>
      </ActionHeader>
      <ContentWrapper>
        <Contents>
          <ResourceList onMaximise={setMaximised} />
          <ResourceCreationOutput
            resources={resources}
            creatingState={creatingState}
          />
        </Contents>
      </ContentWrapper>

      <SaveScenarioModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveScenario}
      />

      <ScenarioLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onLoad={handleLoadScenario}
        onDelete={scenarioLibrary.deleteScenario}
        onListScenarios={scenarioLibrary.listScenarios}
      />
    </Wrapper>
  );
};

export default ResourceCreator;
