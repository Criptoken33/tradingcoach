---
description: Centralized storage service with safe parsing and error handling
---

## Safe Storage Service Scaffolding

Use this workflow to implement a robust, centralized service for persistent data storage (e.g., localStorage) that prevents app crashes and handles storage limits.

### 1. Create the Service File
Create `src/services/storageService.ts`:

```typescript
/**
 * Centralized Storage Service
 * Handles safe parsing, fallback values, and storage error management.
 */

export const storageService = {
  /**
   * Safe Get: Retrieves and parses an item from storage.
   * Returns fallback if key doesn't exist or parsing fails.
   */
  getItem<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      
      const parsed = JSON.parse(item);
      // Extra safety for null strings stored in localStorage
      if (parsed === null && fallback !== null) return fallback;
      
      return parsed ?? fallback;
    } catch (error) {
      console.warn(`[StorageService] Error parsing key "${key}":`, error);
      return fallback;
    }
  },

  /**
   * Safe Set: Persists an item to storage.
   * Handles QuotaExceededError and other potential issues.
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[StorageService] Storage quota exceeded!');
        // Optional: Trigger a notification to the user or clean up old data
      } else {
        console.error(`[StorageService] Error setting key "${key}":`, error);
      }
      return false;
    }
  },

  /**
   * Remove: Deletes an item from storage.
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageService] Error removing key "${key}":`, error);
    }
  },

  /**
   * Clear: Clears all storage data.
   */
  clear(): void {
    localStorage.clear();
  }
};
```

### 2. Implementation Pattern (React Hook)
Create a hook to make it easy to use in components (`src/hooks/useStorage.ts`):

```typescript
import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    return storageService.getItem(key, defaultValue);
  });

  useEffect(() => {
    storageService.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
```

### 3. Usage Example
Instead of scattered `JSON.parse` and `localStorage.getItem` calls:

```typescript
import { storageService } from './services/storageService';

const tradingLog = storageService.getItem<Trade[]>('tradingLog', []);
storageService.setItem('tradingLog', updatedLog);
```

### 4. Scalability Tip: Data Migrations
For production apps, you can add a versioning check in `getItem`:
```typescript
const SCHEMA_VERSION = 1;
// In getItem logic:
if (parsed.version !== SCHEMA_VERSION) {
    return migrate(parsed, SCHEMA_VERSION);
}
```
