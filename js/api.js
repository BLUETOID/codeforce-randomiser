// API module - Codeforces API communication

const Api = {
    /**
     * Fetch all problems from Codeforces
     * Returns { problems: [], problemStatistics: [] }
     */
    async fetchProblems() {
        // Check cache first
        const cached = Cache.get('problems');
        if (cached) {
            return cached;
        }

        const response = await fetch(CF_API.PROBLEMS);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(data.comment || 'API returned error');
        }

        // Cache the result
        Cache.set('problems', data.result, CACHE_TTL.PROBLEMS);
        return data.result;
    },

    /**
     * Fetch user's submissions
     * Returns array of submissions
     */
    async fetchUserSubmissions(handle) {
        if (!handle || !handle.trim()) {
            throw new Error('Handle is required');
        }

        const cacheKey = `user_${handle.toLowerCase()}`;
        const cached = Cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `${CF_API.USER_STATUS}?handle=${encodeURIComponent(handle)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(`User "${handle}" not found`);
            }
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(data.comment || 'API returned error');
        }

        // Cache the result
        Cache.set(cacheKey, data.result, CACHE_TTL.USER);
        return data.result;
    },

    /**
     * Validate a Codeforces handle
     * Returns { valid: boolean, solvedCount: number }
     */
    async validateHandle(handle) {
        try {
            const submissions = await this.fetchUserSubmissions(handle);
            const solvedSet = new Set();

            for (const sub of submissions) {
                if (sub.verdict === 'OK') {
                    solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
            }

            return {
                valid: true,
                solvedCount: solvedSet.size
            };
        } catch (e) {
            return {
                valid: false,
                error: e.message
            };
        }
    },

    /**
     * Fetch user profile information
     * Returns user rating, rank, max rating, etc.
     */
    async fetchUserInfo(handle) {
        if (!handle || !handle.trim()) {
            throw new Error('Handle is required');
        }

        const cacheKey = `userinfo_${handle.toLowerCase()}`;
        const cached = Cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `${CF_API.USER_INFO}?handles=${encodeURIComponent(handle)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(`User "${handle}" not found`);
            }
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(data.comment || 'API returned error');
        }

        const userInfo = data.result[0];

        // Cache the result (shorter TTL for user info)
        Cache.set(cacheKey, userInfo, CACHE_TTL.USER_INFO);
        return userInfo;
    },

    /**
     * Fetch user's rating history
     * Returns array of rating changes from contests
     */
    async fetchUserRatingHistory(handle) {
        if (!handle || !handle.trim()) {
            throw new Error('Handle is required');
        }

        const cacheKey = `rating_history_${handle.toLowerCase()}`;
        const cached = Cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `${CF_API.USER_RATING}?handle=${encodeURIComponent(handle)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(`User "${handle}" not found`);
            }
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(data.comment || 'API returned error');
        }

        // Cache the result
        Cache.set(cacheKey, data.result, CACHE_TTL.USER_INFO);
        return data.result;
    },

    /**
     * Analyze rating trend from recent contests
     * Returns { trend: 'increasing'|'decreasing'|'stable', recentChange: number, avgChange: number }
     */
    analyzeRatingTrend(ratingHistory) {
        if (!ratingHistory || ratingHistory.length < 2) {
            return { trend: 'stable', recentChange: 0, avgChange: 0, contestCount: ratingHistory?.length || 0 };
        }

        // Look at last 5 contests for trend
        const recentContests = ratingHistory.slice(-5);
        let totalChange = 0;

        for (let i = 1; i < recentContests.length; i++) {
            totalChange += recentContests[i].newRating - recentContests[i].oldRating;
        }

        const avgChange = totalChange / (recentContests.length - 1);
        const lastContest = ratingHistory[ratingHistory.length - 1];
        const recentChange = lastContest.newRating - lastContest.oldRating;

        let trend = 'stable';
        if (avgChange > 20) {
            trend = 'increasing';
        } else if (avgChange < -20) {
            trend = 'decreasing';
        }

        return {
            trend,
            recentChange,
            avgChange: Math.round(avgChange),
            contestCount: ratingHistory.length
        };
    },

    /**
     * Analyze solved problems by rating range
     * Returns array of { range: string, count: number, percentage: number }
     */
    analyzeSolvedByRating(submissions) {
        const solvedProblems = new Map(); // problemId -> problem info

        for (const sub of submissions) {
            if (sub.verdict === 'OK' && sub.problem.rating) {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                if (!solvedProblems.has(problemId)) {
                    solvedProblems.set(problemId, sub.problem);
                }
            }
        }

        const totalSolved = solvedProblems.size;
        const ratingBreakdown = RATING_RANGES.map(range => ({
            ...range,
            count: 0
        }));

        // Count problems in each rating range
        for (const problem of solvedProblems.values()) {
            const rating = problem.rating;
            for (const range of ratingBreakdown) {
                if (rating >= range.min && rating <= range.max) {
                    range.count++;
                    break;
                }
            }
        }

        // Calculate percentages
        return ratingBreakdown.map(range => ({
            label: range.label,
            count: range.count,
            percentage: totalSolved > 0 ? Math.round((range.count / totalSolved) * 100) : 0
        }));
    },

    /**
     * Analyze solved problems by tags
     * Returns array of { tag: string, count: number, percentage: number }
     */
    analyzeSolvedByTags(submissions) {
        const solvedProblems = new Set();
        const tagCounts = {};

        for (const sub of submissions) {
            if (sub.verdict === 'OK') {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                if (!solvedProblems.has(problemId)) {
                    solvedProblems.add(problemId);
                    const tags = sub.problem.tags || [];
                    tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            }
        }

        const totalSolved = solvedProblems.size;

        // Convert to array and sort by count descending
        return Object.entries(tagCounts)
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: totalSolved > 0 ? Math.round((count / totalSolved) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Analyze user's weak tags based on solve patterns
     * Returns array of tags the user solves less frequently
     */
    async analyzeWeakTags(handle) {
        const submissions = await this.fetchUserSubmissions(handle);

        // Count solved problems by tag
        const tagCounts = {};
        const solvedProblems = new Set();

        for (const sub of submissions) {
            if (sub.verdict === 'OK') {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                if (!solvedProblems.has(problemId)) {
                    solvedProblems.add(problemId);
                    const tags = sub.problem.tags || [];
                    tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            }
        }

        // Calculate percentage for each tag
        const totalSolved = solvedProblems.size;
        const tagStats = Object.entries(tagCounts)
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: (count / totalSolved) * 100
            }))
            .sort((a, b) => a.percentage - b.percentage);

        // Return bottom 5 tags (weak areas)
        return tagStats.slice(0, 5).map(stat => stat.tag);
    },

    /**
     * Get comprehensive profile statistics
     * Returns all profile data including rating, submissions analysis, etc.
     */
    async getFullProfileStats(handle) {
        const [userInfo, submissions, ratingHistory] = await Promise.all([
            this.fetchUserInfo(handle),
            this.fetchUserSubmissions(handle),
            this.fetchUserRatingHistory(handle).catch(() => []) // May fail for new users
        ]);

        const solvedByRating = this.analyzeSolvedByRating(submissions);
        const solvedByTags = this.analyzeSolvedByTags(submissions);
        const ratingTrend = this.analyzeRatingTrend(ratingHistory);

        // Count unique solved problems
        const solvedSet = new Set();
        for (const sub of submissions) {
            if (sub.verdict === 'OK') {
                solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
        }

        return {
            userInfo,
            solvedCount: solvedSet.size,
            ratingTrend,
            solvedByRating,
            solvedByTags,
            contestCount: ratingHistory.length
        };
    },

    /**
     * Retry a failed API call with exponential backoff
     */
    async retryFetch(fetchFn, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fetchFn();
            } catch (e) {
                if (i === maxRetries - 1) throw e;

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};
