import { StateItem } from '../models/state-requests';

/**
 * Data structure for scenario data
 */
export interface ScenarioData {
  resources: StateItem[];
}

/**
 * A saved scenario with metadata
 */
export interface SavedScenario {
  id: string; // UUID
  title: string;
  description: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  scenario: ScenarioData;
}

/**
 * Paginated list of scenarios (metadata only, without full scenario data)
 */
export interface ScenarioPage {
  scenarios: Omit<SavedScenario, 'scenario'>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Plugin interface for scenario library functionality
 */
export interface ScenarioLibraryPlugin {
  name: string;

  /**
   * Save a new scenario
   */
  saveScenario(scenario: SavedScenario): Promise<void>;

  /**
   * Load a scenario by ID
   */
  loadScenario(id: string): Promise<SavedScenario>;

  /**
   * List scenarios with pagination
   */
  listScenarios(page: number, pageSize: number): Promise<ScenarioPage>;

  /**
   * Delete a scenario by ID
   */
  deleteScenario(id: string): Promise<void>;

  /**
   * Update an existing scenario
   */
  updateScenario(scenario: SavedScenario): Promise<void>;
}
