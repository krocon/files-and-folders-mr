import fetch from "node-fetch";
import {ShortcutMapping, ActionIdMapping} from "./types.js";
import {CONFIG} from "./config.js";

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Loads the shortcut mapping from the API endpoint
 */
export async function loadShortcutMapping(apiUrl?: string): Promise<ShortcutMapping> {
  const url = apiUrl || CONFIG.SHORTCUTS_API_URL;

  if (!url || typeof url !== 'string') {
    throw new ApiError('API URL must be a non-empty string');
  }

  try {
    console.log(`🔗 Loading shortcut mapping from ${url}...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch shortcuts: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError('API response is not valid JSON');
    }

    const data = await response.json() as unknown;

    if (!data || typeof data !== 'object') {
      throw new ApiError('API response is not a valid object');
    }

    const shortcutMapping = data as ShortcutMapping;

    // Validate that the mapping contains string keys and values
    for (const [key, value] of Object.entries(shortcutMapping)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        throw new ApiError('Invalid shortcut mapping format: keys and values must be strings');
      }
    }

    console.log(`✅ Successfully loaded ${Object.keys(shortcutMapping).length} shortcut mappings`);
    return shortcutMapping;

  } catch (error) {
    if (error instanceof ApiError) {
      console.warn(`⚠️ API Error: ${error.message}`);
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to load shortcut mapping from ${url}: ${errorMessage}`);

    // Return empty mapping as fallback for network errors
    if (error instanceof TypeError && errorMessage.includes('fetch')) {
      console.warn('⚠️ Network error detected, returning empty mapping as fallback');
      return {};
    }

    throw new ApiError(`Failed to load shortcut mapping: ${errorMessage}`);
  }
}

/**
 * Creates a reverse lookup mapping from ActionId to keyboard shortcut
 */
export function createActionIdToShortcutMapping(shortcutMapping: ShortcutMapping): ActionIdMapping {
  if (!shortcutMapping || typeof shortcutMapping !== 'object') {
    throw new Error('Shortcut mapping must be a valid object');
  }

  const reverseMapping: ActionIdMapping = {};
  let mappingCount = 0;

  try {
    for (const [shortcut, actionId] of Object.entries(shortcutMapping)) {
      if (typeof shortcut !== 'string' || typeof actionId !== 'string') {
        console.warn(`⚠️ Skipping invalid mapping entry: ${shortcut} -> ${actionId}`);
        continue;
      }

      if (!shortcut.trim() || !actionId.trim()) {
        console.warn(`⚠️ Skipping empty mapping entry: "${shortcut}" -> "${actionId}"`);
        continue;
      }

      // Check for duplicate ActionIds
      if (reverseMapping[actionId]) {
        console.warn(`⚠️ Duplicate ActionId found: ${actionId}. Overwriting previous mapping.`);
      }

      reverseMapping[actionId] = shortcut;
      mappingCount++;
    }

    console.log(`✅ Created ${mappingCount} ActionId mappings`);
    return reverseMapping;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create ActionId mapping: ${errorMessage}`);
  }
}

/**
 * Validates that the API is accessible and returns basic health information
 */
export async function validateApiConnection(apiUrl?: string): Promise<boolean> {
  const url = apiUrl || CONFIG.SHORTCUTS_API_URL;

  try {
    const response = await fetch(url, {
      method: 'HEAD'
    });

    return response.ok;
  } catch (error) {
    console.warn(`⚠️ API connection validation failed for ${url}:`, error);
    return false;
  }
}