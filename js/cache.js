// Cache module - LocalStorage with TTL support

const Cache = {
    /**
     * Set a value in cache with TTL
     */
    set(key, data, ttl = CACHE_TTL.PROBLEMS) {
        try {
            const entry = {
                timestamp: Date.now(),
                ttl: ttl,
                data: data
            };
            localStorage.setItem(`cf_${key}`, JSON.stringify(entry));
            return true;
        } catch (e) {
            console.warn('Cache write failed:', e);
            return false;
        }
    },

    /**
     * Get a value from cache (returns null if expired or not found)
     */
    get(key) {
        try {
            const raw = localStorage.getItem(`cf_${key}`);
            if (!raw) return null;

            const entry = JSON.parse(raw);
            const age = Date.now() - entry.timestamp;

            if (age > entry.ttl) {
                localStorage.removeItem(`cf_${key}`);
                return null;
            }

            return entry.data;
        } catch (e) {
            console.warn('Cache read failed:', e);
            return null;
        }
    },

    /**
     * Remove a specific key from cache
     */
    remove(key) {
        localStorage.removeItem(`cf_${key}`);
    },

    /**
     * Clear all CF-related cache entries
     */
    clear() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cf_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};
