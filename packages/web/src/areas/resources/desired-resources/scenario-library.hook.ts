import { useState, useEffect, useCallback } from 'react';
import { SavedScenario, ScenarioPage } from '@haydenon/gen-server';
import { deserializeScenario, serializeScenario } from '../scenario-serialization';
import { DesiredResource } from './desired-resource';

export interface UseScenarioLibraryResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | undefined;
  saveScenario: (title: string, description: string) => Promise<string>;
  loadScenario: (id: string) => Promise<DesiredResource[]>;
  listScenarios: (page: number, pageSize: number) => Promise<ScenarioPage>;
  deleteScenario: (id: string) => Promise<void>;
}

export const useScenarioLibrary = (
  currentResources: DesiredResource[]
): UseScenarioLibraryResult => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Check if scenario library is enabled on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/v1/scenarios/status');
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.enabled === true);
        }
      } catch (err) {
        console.error('Failed to check scenario library status:', err);
        setIsEnabled(false);
      }
    };

    checkStatus();
  }, []);

  const saveScenario = useCallback(
    async (title: string, description: string): Promise<string> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const scenarioData = serializeScenario(currentResources);

        const response = await fetch('/v1/scenarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            scenario: scenarioData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.errors?.[0]?.message || 'Failed to save scenario';
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.id;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save scenario';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentResources]
  );

  const loadScenario = useCallback(
    async (id: string): Promise<DesiredResource[]> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`/v1/scenarios/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.errors?.[0]?.message || 'Failed to load scenario';
          throw new Error(errorMessage);
        }

        const savedScenario: SavedScenario = await response.json();
        const resources = deserializeScenario(savedScenario.scenario);

        return resources;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load scenario';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const listScenarios = useCallback(
    async (page: number, pageSize: number): Promise<ScenarioPage> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch(
          `/v1/scenarios?page=${page}&pageSize=${pageSize}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.errors?.[0]?.message || 'Failed to list scenarios';
          throw new Error(errorMessage);
        }

        const scenarioPage: ScenarioPage = await response.json();
        return scenarioPage;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to list scenarios';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteScenario = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`/v1/scenarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.errors?.[0]?.message || 'Failed to delete scenario';
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete scenario';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isEnabled,
    isLoading,
    error,
    saveScenario,
    loadScenario,
    listScenarios,
    deleteScenario,
  };
};
