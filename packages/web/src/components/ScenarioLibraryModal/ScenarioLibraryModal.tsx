import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { SavedScenario, ScenarioPage } from '@haydenon/gen-server';
import Card from '../Card';
import Button, { ButtonColour } from '../Button/Button';
import Loader from '../Loader';

interface ScenarioLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onListScenarios: (page: number, pageSize: number) => Promise<ScenarioPage>;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-base);
`;

const ModalCard = styled(Card)`
  width: clamp(500px, 90%, 800px);
  max-width: 100%;
  max-height: 80vh;
  position: relative;
  z-index: 1001;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: var(--spacing-base);
  font-size: 1.5rem;
`;

const ScenarioList = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  margin-bottom: var(--spacing-base);
`;

const ScenarioItem = styled.div`
  padding: var(--spacing-base);
  border: 1px solid var(--colors-contentBackground);
  border-radius: var(--borders-radius);
  margin-bottom: var(--spacing-small);
  background: var(--colors-contentBackground-light);

  &:hover {
    background: var(--colors-contentBackground-light-focusable);
  }
`;

const ScenarioTitle = styled.div`
  font-weight: 600;
  margin-bottom: var(--spacing-tiny);
  color: var(--colors-text);
`;

const ScenarioDescription = styled.div`
  color: var(--colors-textSecondary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-small);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ScenarioMeta = styled.div`
  font-size: 0.85rem;
  color: var(--colors-textSecondary);
  margin-bottom: var(--spacing-small);
`;

const ScenarioActions = styled.div`
  display: flex;
  gap: var(--spacing-small);
  justify-content: flex-end;
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--colors-contentBackground);
`;

const PageInfo = styled.div`
  font-size: 0.9rem;
  color: var(--colors-textSecondary);
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: var(--spacing-small);
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
`;

const ErrorMessage = styled.div`
  color: var(--colour-error);
  margin-bottom: var(--spacing-small);
  padding: var(--spacing-small);
  background: var(--colors-contentBackground-danger-disabled);
  border-radius: var(--borders-radius);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-large);
  color: var(--colors-textSecondary);
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-large);
`;

const ScenarioLibraryModal = ({
  isOpen,
  onClose,
  onLoad,
  onDelete,
  onListScenarios,
}: ScenarioLibraryModalProps) => {
  const [scenarios, setScenarios] = useState<Omit<SavedScenario, 'scenario'>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | undefined>(undefined);

  const pageSize = 20;

  const fetchScenarios = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(undefined);

    try {
      const scenarioPage = await onListScenarios(pageNum, pageSize);
      setScenarios(scenarioPage.scenarios);
      setTotal(scenarioPage.total);
      setTotalPages(scenarioPage.totalPages);
      setPage(pageNum);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [onListScenarios]);

  // Fetch scenarios when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchScenarios(1);
    }
  }, [isOpen, fetchScenarios]);

  const handleLoad = async (id: string) => {
    // Confirm before loading (will replace current resources)
    if (!window.confirm('Loading this scenario will replace your current resources. Continue?')) {
      return;
    }

    setLoadingScenarioId(id);
    setError(undefined);

    try {
      await onLoad(id);
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoadingScenarioId(undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scenario?')) {
      return;
    }

    setError(undefined);

    try {
      await onDelete(id);
      // Refresh the list
      await fetchScenarios(page);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleClose = () => {
    if (!loading && !loadingScenarioId) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalCard>
              <Title>Scenario Library</Title>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ScenarioList>
                {loading ? (
                  <LoaderWrapper>
                    <Loader />
                  </LoaderWrapper>
                ) : scenarios.length === 0 ? (
                  <EmptyState>No saved scenarios found. Save your first scenario to get started!</EmptyState>
                ) : (
                  scenarios.map((scenario) => (
                    <ScenarioItem key={scenario.id}>
                      <ScenarioTitle>{scenario.title}</ScenarioTitle>
                      {scenario.description && (
                        <ScenarioDescription>{scenario.description}</ScenarioDescription>
                      )}
                      <ScenarioMeta>
                        Created: {formatDate(scenario.createdAt)}
                        {scenario.updatedAt !== scenario.createdAt && ` • Updated: ${formatDate(scenario.updatedAt)}`}
                      </ScenarioMeta>
                      <ScenarioActions>
                        <Button
                          colour={ButtonColour.Success}
                          onClick={() => handleLoad(scenario.id)}
                          disabled={loadingScenarioId !== undefined}
                        >
                          {loadingScenarioId === scenario.id ? 'Loading...' : 'Load'}
                        </Button>
                        <Button
                          colour={ButtonColour.Danger}
                          onClick={() => handleDelete(scenario.id)}
                          disabled={loadingScenarioId !== undefined}
                        >
                          Delete
                        </Button>
                      </ScenarioActions>
                    </ScenarioItem>
                  ))
                )}
              </ScenarioList>

              {totalPages > 1 && (
                <PaginationRow>
                  <PageInfo>
                    Page {page} of {totalPages} ({total} total)
                  </PageInfo>
                  <PaginationButtons>
                    <Button
                      onClick={() => fetchScenarios(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => fetchScenarios(page + 1)}
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </PaginationButtons>
                </PaginationRow>
              )}

              <ButtonRow>
                <Button onClick={handleClose} disabled={loading || loadingScenarioId !== undefined}>
                  Close
                </Button>
              </ButtonRow>
            </ModalCard>
          </motion.div>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ScenarioLibraryModal;
