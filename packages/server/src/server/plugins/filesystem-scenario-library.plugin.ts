import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ScenarioLibraryPlugin,
  SavedScenario,
  ScenarioPage,
} from './scenario-library-plugin.interface';

/**
 * Filesystem-based implementation of ScenarioLibraryPlugin
 * Stores scenarios as JSON files in a specified directory
 */
export class FilesystemScenarioLibraryPlugin implements ScenarioLibraryPlugin {
  name = 'FilesystemScenarioLibrary';

  constructor(private storagePath: string) {}

  /**
   * Ensure the storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(this.storagePath);
    } catch {
      await fs.mkdir(this.storagePath, { recursive: true });
    }
  }

  /**
   * Get the file path for a scenario ID
   */
  private getScenarioFilePath(id: string): string {
    return path.join(this.storagePath, `${id}.json`);
  }

  async saveScenario(scenario: SavedScenario): Promise<void> {
    await this.ensureStorageDirectory();
    const filePath = this.getScenarioFilePath(scenario.id);
    await fs.writeFile(filePath, JSON.stringify(scenario, null, 2), 'utf-8');
  }

  async loadScenario(id: string): Promise<SavedScenario> {
    const filePath = this.getScenarioFilePath(id);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as SavedScenario;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Scenario with id "${id}" not found`);
      }
      throw error;
    }
  }

  async listScenarios(page: number, pageSize: number): Promise<ScenarioPage> {
    await this.ensureStorageDirectory();

    // Read all files in the directory
    const files = await fs.readdir(this.storagePath);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    // Read metadata from each file
    const scenariosWithDates: Array<{
      scenario: Omit<SavedScenario, 'scenario'>;
      createdAt: Date;
    }> = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(this.storagePath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const fullScenario = JSON.parse(content) as SavedScenario;

        // Extract metadata only (omit scenario data)
        const { scenario: _, ...metadata } = fullScenario;

        scenariosWithDates.push({
          scenario: metadata,
          createdAt: new Date(fullScenario.createdAt),
        });
      } catch (error) {
        // Skip invalid files
        console.error(`Failed to read scenario file ${file}:`, error);
      }
    }

    // Sort by createdAt descending (newest first)
    scenariosWithDates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination
    const total = scenariosWithDates.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get the page of scenarios
    const scenarios = scenariosWithDates
      .slice(startIndex, endIndex)
      .map((item) => item.scenario);

    return {
      scenarios,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async deleteScenario(id: string): Promise<void> {
    const filePath = this.getScenarioFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Scenario with id "${id}" not found`);
      }
      throw error;
    }
  }

  async updateScenario(scenario: SavedScenario): Promise<void> {
    // Check if the scenario exists first
    const filePath = this.getScenarioFilePath(scenario.id);
    try {
      await fs.access(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Scenario with id "${scenario.id}" not found`);
      }
      throw error;
    }

    // Update the file
    await fs.writeFile(filePath, JSON.stringify(scenario, null, 2), 'utf-8');
  }
}
