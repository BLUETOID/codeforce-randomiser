// Filters module - Filtering and randomization logic

const Filters = {
    /**
     * Filter problems by rating range
     */
    byRating(problems, minRating, maxRating) {
        return problems.filter(p => {
            if (!p.rating) return false;
            return p.rating >= minRating && p.rating <= maxRating;
        });
    },

    /**
     * Filter problems by tags
     * mode: 'any' - problem has at least one of the tags
     * mode: 'all' - problem has all of the tags
     */
    byTags(problems, tags, mode = 'any') {
        if (!tags || tags.length === 0) {
            return problems;
        }

        return problems.filter(p => {
            const problemTags = p.tags || [];
            if (mode === 'all') {
                return tags.every(tag => problemTags.includes(tag));
            } else {
                return tags.some(tag => problemTags.includes(tag));
            }
        });
    },

    /**
     * Filter problems by contest type
     */
    byContestType(problems, contestType) {
        if (!contestType || contestType === 'all') {
            return problems;
        }

        return problems.filter(p => {
            // We need to determine contest type from the problem
            // For now, we can use a simple heuristic based on contest ID ranges
            // This is approximate but works for most cases
            const contestId = p.contestId;

            if (!contestId) return false;

            // Contest ID patterns (approximate):
            // Div 1: typically older contests or high div
            // Div 2: most common
            // Div 3 & 4: newer, lower-rated contests
            // Educational: 1300+ range
            // Global: specific IDs

            // Check if it's an educational round (typically in 13xx-19xx range with "EDU" in index)
            if (contestType === 'educational') {
                return contestId >= 1300 && contestId < 2000;
            }

            // This is a simplified filter - in a production app, you'd maintain
            // a mapping of contest IDs to types
            return true; // For now, show all for other filters
        });
    },

    /**
     * Extract solved problem IDs from submissions
     */
    extractSolvedIds(submissions) {
        const solved = new Set();
        for (const sub of submissions) {
            if (sub.verdict === 'OK') {
                solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
        }
        return solved;
    },

    /**
     * Exclude solved problems
     */
    excludeSolved(problems, solvedIds) {
        if (!solvedIds || solvedIds.size === 0) {
            return problems;
        }

        return problems.filter(p => {
            const problemId = `${p.contestId}-${p.index}`;
            return !solvedIds.has(problemId);
        });
    },

    /**
     * Pick a random problem from the list
     */
    pickRandom(problems) {
        if (!problems || problems.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * problems.length);
        return problems[index];
    },

    /**
     * Build problem URL
     */
    getProblemUrl(problem) {
        return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
    },

    /**
     * Main entry point - get a random problem with all filters applied
     */
    async getRandomProblem(options) {
        const {
            minRating = RATING_MIN,
            maxRating = RATING_MAX,
            tags = [],
            tagMode = 'any',
            contestType = 'all',
            excludeHandle = null,
            skipSeen = true,
            seenIds = new Set()
        } = options;

        // Fetch problems
        const { problems, problemStatistics } = await Api.fetchProblems();

        // Create stats map for quick lookup
        const statsMap = new Map();
        if (problemStatistics) {
            problemStatistics.forEach(stat => {
                const id = `${stat.contestId}-${stat.index}`;
                statsMap.set(id, stat);
            });
        }

        // Get solved IDs if handle provided
        let solvedIds = new Set();
        if (excludeHandle) {
            const submissions = await Api.fetchUserSubmissions(excludeHandle);
            solvedIds = this.extractSolvedIds(submissions);
        }

        // Apply filters
        let filtered = problems;
        filtered = this.byRating(filtered, minRating, maxRating);
        filtered = this.byTags(filtered, tags, tagMode);
        filtered = this.byContestType(filtered, contestType);
        filtered = this.excludeSolved(filtered, solvedIds);

        // Exclude seen problems
        if (skipSeen && seenIds.size > 0) {
            filtered = filtered.filter(p => {
                const id = `${p.contestId}-${p.index}`;
                return !seenIds.has(id);
            });
        }

        // Pick random
        const selected = this.pickRandom(filtered);

        if (!selected) {
            return {
                success: false,
                error: 'No problems match your criteria',
                matchingCount: 0
            };
        }

        // Add statistics to problem
        const problemId = `${selected.contestId}-${selected.index}`;
        const stats = statsMap.get(problemId) || {};

        return {
            success: true,
            problem: {
                ...selected,
                url: this.getProblemUrl(selected),
                solvedCount: stats.solvedCount || 0
            },
            matchingCount: filtered.length
        };
    },

    /**
     * Count matching problems (for live preview)
     */
    async countMatching(options) {
        const {
            minRating = RATING_MIN,
            maxRating = RATING_MAX,
            tags = [],
            tagMode = 'any',
            contestType = 'all',
            excludeHandle = null,
            skipSeen = true,
            solvedIds = new Set(),
            seenIds = new Set()
        } = options;

        const { problems } = await Api.fetchProblems();

        let filtered = problems;
        filtered = this.byRating(filtered, minRating, maxRating);
        filtered = this.byTags(filtered, tags, tagMode);
        filtered = this.byContestType(filtered, contestType);
        filtered = this.excludeSolved(filtered, solvedIds);

        // Exclude seen problems
        if (skipSeen && seenIds.size > 0) {
            filtered = filtered.filter(p => {
                const id = `${p.contestId}-${p.index}`;
                return !seenIds.has(id);
            });
        }

        return filtered.length;
    }
};
