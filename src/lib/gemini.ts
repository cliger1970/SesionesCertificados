import { readDbFile, writeDbFile } from './db';
import { ApiKeyConfig } from './types';

const API_KEYS_FILE = 'gemini_config.json';

export function getGeminiConfig(): ApiKeyConfig {
  const defaultKeys: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    defaultKeys.push(process.env.GEMINI_API_KEY);
  }
  return readDbFile<ApiKeyConfig>(API_KEYS_FILE, {
    keys: defaultKeys,
    preferredModel: 'gemini-3.5-flash-lite'
  });
}

export function saveGeminiConfig(config: ApiKeyConfig): void {
  writeDbFile(API_KEYS_FILE, config);
}

export interface GeminiModelInfo {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export async function fetchAvailableGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error fetching models (${response.status}): ${errText}`);
  }
  const data = await response.json();
  const models: GeminiModelInfo[] = (data.models || [])
    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: any) => ({
      name: m.name.replace('models/', ''),
      version: m.version,
      displayName: m.displayName || m.name,
      description: m.description || '',
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      supportedGenerationMethods: m.supportedGenerationMethods
    }));
  return models;
}

// Order of preference for text generation models: newest & fast first
export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

export async function callGeminiWithFailover(
  prompt: string, 
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<{ text: string; modelUsed: string; keyIndex: number }> {
  const config = getGeminiConfig();
  const keys = config.keys.filter(k => k && k.trim().length > 0);

  if (keys.length === 0) {
    throw new Error('No hay claves API de Gemini configuradas. Por favor agrega una en la pestaña de Configuración.');
  }

  // Determine models to try
  const modelsToTry: string[] = [];
  if (config.preferredModel && !modelsToTry.includes(config.preferredModel)) {
    modelsToTry.push(config.preferredModel);
  }
  for (const m of FALLBACK_MODELS) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError: any = null;

  // Key Failover Loop
  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const key = keys[keyIdx].trim();

    // Model Fallback Loop for this key
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        
        const bodyPayload: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        };

        if (systemInstruction) {
          bodyPayload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        if (jsonMode) {
          bodyPayload.generationConfig = {
            responseMimeType: 'application/json',
            temperature: 0.2
          };
        } else {
          bodyPayload.generationConfig = {
            temperature: 0.4
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.warn(`Key #${keyIdx + 1} with model ${model} failed with ${res.status}: ${errBody}`);
          // If 404, this specific model might not exist, try next model with same key
          if (res.status === 404) {
            continue;
          }
          // If 429 (rate limit) or 403, try next key
          if (res.status === 429 || res.status === 403 || res.status === 400) {
            lastError = new Error(`Key #${keyIdx + 1} error (${res.status}): ${errBody}`);
            break; // Break model loop, advance to next key
          }
          lastError = new Error(`Status ${res.status}: ${errBody}`);
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

        if (!text) {
          throw new Error('Respuesta vacía de Gemini.');
        }

        return {
          text,
          modelUsed: model,
          keyIndex: keyIdx
        };

      } catch (err: any) {
        lastError = err;
        console.warn(`Error trying key #${keyIdx + 1} model ${model}:`, err.message);
      }
    }
  }

  throw new Error(`Todas las claves o modelos de Gemini fallaron. Último error: ${lastError?.message || 'Error desconocido'}`);
}
