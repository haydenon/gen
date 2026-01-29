import { StateItem } from '../models/state-requests';
import { Resource, PropertyMap } from '@haydenon/gen-core';

/**
 * Simplified resource descriptor for AI context
 */
export interface ResourceDescriptor {
  name: string;
  description?: string;
  inputs: PropertyDescriptor[];
  outputs: PropertyDescriptor[];
}

/**
 * Simplified property descriptor for AI context
 */
export interface PropertyDescriptor {
  name: string;
  description?: string;
  type: string;
  required: boolean;
  linkedResources?: string[];
  relatedPropertyNames?: string[];
}

/**
 * Request passed to AI plugin for scenario generation
 */
export interface AIGenerationRequest {
  scenarioPrompt: string;
  fullPrompt: string;
  availableResources: Resource<PropertyMap, PropertyMap>[];
  environment: string;
}

/**
 * Response from AI plugin containing generated resources and any errors
 */
export interface AIGenerationResponse {
  resources: StateItem[];
  errors: string[];
}

/**
 * Plugin interface for AI-powered scenario generation
 */
export interface AIScenarioGeneratorPlugin {
  name: string;
  generateScenario(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse>;
}
