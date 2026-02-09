/**
 * Centralized Storage Service
 * Handles safe parsing and error management for persistent data.
 */

export const storageService = {
    /**
     * Safe Get: Retrieves and parses an item from storage.
     * Returns fallback if key doesn't exist or parsing fails.
     */
    getItem<T>(key: string, fallback: T, schema?: any): T {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return fallback;

            const parsed = JSON.parse(item);

            // If a schema is provided, validate the data
            if (schema) {
                const result = schema.safeParse(parsed);
                if (!result.success) {
                    console.warn(`[StorageService] Validation failed for key "${key}":`, result.error.errors);
                    return fallback;
                }
                return result.data;
            }

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
     */
    setItem<T>(key: string, value: T): boolean {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.error('[StorageService] Storage quota exceeded!');
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
    }
};
