// Recommendations module - Advanced personalized problem recommendations based on user analysis

const Recommendations = {
    // Global Codeforces tag distribution (approximate percentages based on problem pool)
    // This represents how often each tag appears across all CF problems
    GLOBAL_TAG_DISTRIBUTION: {
        'implementation': 22.5,
        'math': 18.2,
        'greedy': 14.8,
        'dp': 13.5,
        'data structures': 11.2,
        'brute force': 10.8,
        'constructive algorithms': 10.5,
        'sortings': 8.4,
        'binary search': 7.6,
        'dfs and similar': 6.8,
        'graphs': 6.5,
        'strings': 6.2,
        'number theory': 5.8,
        'two pointers': 4.9,
        'bitmasks': 4.5,
        'trees': 4.2,
        'combinatorics': 3.8,
        'geometry': 3.2,
        'dsu': 2.8,
        'divide and conquer': 2.5,
        'games': 2.3,
        'interactive': 2.1,
        'probabilities': 1.8,
        'shortest paths': 1.7,
        'hashing': 1.6,
        'matrices': 1.4,
        'flows': 1.2,
        'string suffix structures': 1.0,
        'fft': 0.8,
        'meet-in-the-middle': 0.7,
        '2-sat': 0.6,
        'ternary search': 0.5,
        'graph matchings': 0.5,
        'expression parsing': 0.4,
        'chinese remainder theorem': 0.3,
        'schedules': 0.2
    },

    // Foundational tags that are essential for competitive programming
    FOUNDATIONAL_TAGS: [
        'implementation', 'math', 'greedy', 'dp', 'binary search',
        'data structures', 'brute force', 'constructive algorithms',
        'graphs', 'dfs and similar', 'trees', 'sortings', 'two pointers'
    ],

    // Advanced tags that indicate higher skill
    ADVANCED_TAGS: [
        'flows', 'fft', 'string suffix structures', 'meet-in-the-middle',
        '2-sat', 'graph matchings', 'matrices', 'chinese remainder theorem'
    ],

    /**
     * Comprehensive user skill analysis with enhanced metrics
     * Returns detailed stats about user's solving patterns
     */
    async analyzeUser(handle) {
        const submissions = await Api.fetchUserSubmissions(handle);
        const { problems, problemStatistics } = await Api.fetchProblems();

        // Build problem statistics map
        const problemStatsMap = this.buildProblemStatsMap(problemStatistics);

        // Build solved and attempted problems with detailed info
        const { solvedProblems, attemptedProblems, solveTimeData } =
            this.processSubmissions(submissions, problemStatsMap);

        // Fetch user info and rating history for contest performance
        let userInfo = null;
        let ratingHistory = [];
        try {
            userInfo = await Api.fetchUserInfo(handle);
            ratingHistory = await Api.fetchUserRatingHistory(handle);
        } catch (e) {
            // Continue without contest data
        }

        // Calculate rating distribution
        const ratingDistribution = this.calculateRatingDistribution(solvedProblems);

        // Calculate detailed tag statistics
        const tagStats = this.calculateEnhancedTagStats(solvedProblems, attemptedProblems, problems);

        // Calculate success rates by rating
        const successByRating = this.calculateSuccessRateByRating(solvedProblems, attemptedProblems);

        // Estimate skill level with weighted moving average and multiple factors
        const skillLevel = this.estimateEnhancedSkillLevel(
            ratingDistribution,
            solvedProblems,
            solveTimeData,
            ratingHistory,
            userInfo,
            successByRating
        );

        // Identify weak topics with comparison to global distribution
        const weakTopics = this.identifyEnhancedWeakTopics(tagStats, skillLevel, this.GLOBAL_TAG_DISTRIBUTION);

        // Get recommended focus areas with priority scoring
        const focusTopics = this.getEnhancedFocusTopics(tagStats, weakTopics, solvedProblems.size, skillLevel);

        // Calculate recommended rating range based on success rate
        const recommendedRange = this.calculateDynamicRatingRange(skillLevel, successByRating);

        // Calculate difficulty progression recommendation
        const difficultyProgression = this.calculateDifficultyProgression(successByRating, skillLevel);

        // Identify comfort and struggle zones
        const zones = this.identifyZones(successByRating, skillLevel);

        return {
            handle,
            totalSolved: solvedProblems.size,
            totalAttempted: attemptedProblems.size,
            ratingDistribution,
            tagStats,
            skillLevel,
            weakTopics,
            focusTopics,
            recommendedRange,
            difficultyProgression,
            zones,
            successByRating,
            solvedProblems: Array.from(solvedProblems.values()),
            attemptedProblems: Array.from(attemptedProblems.values()),
            recentActivity: this.analyzeRecentActivity(solvedProblems)
        };
    },

    /**
     * Build a map of problem statistics for quick lookup
     */
    buildProblemStatsMap(problemStatistics) {
        const map = new Map();
        if (problemStatistics) {
            for (const stat of problemStatistics) {
                map.set(`${stat.contestId}-${stat.index}`, stat);
            }
        }
        return map;
    },

    /**
     * Process submissions and extract detailed solve information
     */
    processSubmissions(submissions, problemStatsMap) {
        const solvedProblems = new Map();
        const attemptedProblems = new Map();
        const solveTimeData = []; // Track solve times for analysis

        // Sort submissions by time to process in order
        const sortedSubs = [...submissions].sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);

        // Track first attempt time for each problem
        const firstAttemptTime = new Map();

        for (const sub of sortedSubs) {
            const problemId = `${sub.problem.contestId}-${sub.problem.index}`;

            // Track first attempt
            if (!firstAttemptTime.has(problemId)) {
                firstAttemptTime.set(problemId, sub.creationTimeSeconds);
            }

            if (sub.verdict === 'OK') {
                if (!solvedProblems.has(problemId)) {
                    const firstAttempt = firstAttemptTime.get(problemId);
                    const solveTime = sub.creationTimeSeconds - firstAttempt;
                    const stats = problemStatsMap.get(problemId) || {};

                    // Calculate relative difficulty based on solve count
                    const solveCount = stats.solvedCount || 0;

                    solvedProblems.set(problemId, {
                        ...sub.problem,
                        solveTime: sub.creationTimeSeconds,
                        timeToSolve: solveTime, // Time from first attempt to AC
                        attempts: (attemptedProblems.get(problemId)?.attempts || 0) + 1,
                        solveCount: solveCount,
                        participantType: sub.author?.participantType || 'PRACTICE',
                        isContest: sub.author?.participantType === 'CONTESTANT'
                    });

                    // Store solve time data for analysis
                    if (sub.problem.rating) {
                        solveTimeData.push({
                            rating: sub.problem.rating,
                            timeToSolve: solveTime,
                            attempts: (attemptedProblems.get(problemId)?.attempts || 0) + 1,
                            isContest: sub.author?.participantType === 'CONTESTANT'
                        });
                    }

                    // Remove from attempted since it's now solved
                    attemptedProblems.delete(problemId);
                }
            } else {
                // Track failed attempts only for unsolved problems
                if (!solvedProblems.has(problemId)) {
                    const current = attemptedProblems.get(problemId) || {
                        attempts: 0,
                        problem: sub.problem,
                        firstAttempt: sub.creationTimeSeconds
                    };
                    current.attempts++;
                    current.lastAttempt = sub.creationTimeSeconds;
                    attemptedProblems.set(problemId, current);
                }
            }
        }

        return { solvedProblems, attemptedProblems, solveTimeData };
    },

    /**
     * Calculate distribution of solved problems by rating
     */
    calculateRatingDistribution(solvedProblems) {
        const distribution = {};
        let totalWithRating = 0;

        for (const problem of solvedProblems.values()) {
            if (problem.rating) {
                const bucket = Math.floor(problem.rating / 100) * 100;
                distribution[bucket] = (distribution[bucket] || 0) + 1;
                totalWithRating++;
            }
        }

        // Convert to sorted array with percentages
        const result = Object.entries(distribution)
            .map(([rating, count]) => ({
                rating: parseInt(rating),
                count,
                percentage: totalWithRating > 0 ? (count / totalWithRating) * 100 : 0
            }))
            .sort((a, b) => a.rating - b.rating);

        return {
            buckets: result,
            totalWithRating,
            minRating: result.length > 0 ? result[0].rating : 800,
            maxRating: result.length > 0 ? result[result.length - 1].rating : 800
        };
    },

    /**
     * Calculate success rate by rating bucket
     */
    calculateSuccessRateByRating(solvedProblems, attemptedProblems) {
        const ratingData = {};

        // Count solved per rating bucket
        for (const problem of solvedProblems.values()) {
            if (problem.rating) {
                const bucket = Math.floor(problem.rating / 100) * 100;
                if (!ratingData[bucket]) {
                    ratingData[bucket] = { solved: 0, attempted: 0, totalAttempts: 0 };
                }
                ratingData[bucket].solved++;
                ratingData[bucket].totalAttempts += problem.attempts || 1;
            }
        }

        // Count failed attempts per rating bucket
        for (const { problem, attempts } of attemptedProblems.values()) {
            if (problem.rating) {
                const bucket = Math.floor(problem.rating / 100) * 100;
                if (!ratingData[bucket]) {
                    ratingData[bucket] = { solved: 0, attempted: 0, totalAttempts: 0 };
                }
                ratingData[bucket].attempted++;
                ratingData[bucket].totalAttempts += attempts;
            }
        }

        // Calculate success rates
        const result = {};
        for (const [rating, data] of Object.entries(ratingData)) {
            const total = data.solved + data.attempted;
            result[rating] = {
                ...data,
                total,
                successRate: total > 0 ? (data.solved / total) * 100 : 0,
                avgAttempts: data.solved > 0 ? data.totalAttempts / data.solved : 0
            };
        }

        return result;
    },

    /**
     * Calculate enhanced tag statistics with difficulty consideration
     */
    calculateEnhancedTagStats(solvedProblems, attemptedProblems, allProblems) {
        const tagData = {};

        // Count solved problems per tag with ratings and detailed info
        for (const problem of solvedProblems.values()) {
            const tags = problem.tags || [];
            const rating = problem.rating || 0;

            tags.forEach(tag => {
                if (!tagData[tag]) {
                    tagData[tag] = {
                        tag,
                        solved: 0,
                        attempted: 0,
                        totalRating: 0,
                        ratings: [],
                        ratingCounts: {},
                        contestSolves: 0,
                        practiceSolves: 0,
                        totalAttempts: 0,
                        quickSolves: 0 // Solved in under 30 mins
                    };
                }
                tagData[tag].solved++;
                tagData[tag].totalRating += rating;
                tagData[tag].totalAttempts += problem.attempts || 1;

                if (rating) {
                    tagData[tag].ratings.push(rating);
                    const bucket = Math.floor(rating / 100) * 100;
                    tagData[tag].ratingCounts[bucket] = (tagData[tag].ratingCounts[bucket] || 0) + 1;
                }

                if (problem.isContest) {
                    tagData[tag].contestSolves++;
                } else {
                    tagData[tag].practiceSolves++;
                }

                // Quick solve (under 30 minutes = 1800 seconds)
                if (problem.timeToSolve && problem.timeToSolve < 1800) {
                    tagData[tag].quickSolves++;
                }
            });
        }

        // Count attempted but not solved with failure tracking
        for (const { problem, attempts } of attemptedProblems.values()) {
            const tags = problem.tags || [];
            tags.forEach(tag => {
                if (!tagData[tag]) {
                    tagData[tag] = {
                        tag,
                        solved: 0,
                        attempted: 0,
                        totalRating: 0,
                        ratings: [],
                        ratingCounts: {},
                        contestSolves: 0,
                        practiceSolves: 0,
                        totalAttempts: 0,
                        quickSolves: 0
                    };
                }
                tagData[tag].attempted++;
                tagData[tag].totalAttempts += attempts;
            });
        }

        // Calculate comprehensive stats per tag
        const stats = Object.values(tagData).map(data => {
            const totalProblems = data.solved + data.attempted;
            const successRate = totalProblems > 0 ? (data.solved / totalProblems) * 100 : 100;
            const avgRating = data.solved > 0 ? Math.round(data.totalRating / data.solved) : 0;
            const maxRatingSolved = data.ratings.length > 0 ? Math.max(...data.ratings) : 0;
            const minRatingSolved = data.ratings.length > 0 ? Math.min(...data.ratings) : 0;

            // Calculate rating spread (diversity of difficulty levels tackled)
            const ratingSpread = maxRatingSolved - minRatingSolved;

            // Calculate efficiency (how many attempts per solve)
            const efficiency = data.solved > 0 ? data.totalAttempts / data.solved : 0;

            // Quick solve ratio
            const quickSolveRatio = data.solved > 0 ? (data.quickSolves / data.solved) * 100 : 0;

            // Contest vs practice ratio
            const contestRatio = data.solved > 0 ? (data.contestSolves / data.solved) * 100 : 0;

            return {
                tag: data.tag,
                solved: data.solved,
                attempted: data.attempted,
                successRate: Math.round(successRate * 10) / 10,
                avgRating,
                maxRatingSolved,
                minRatingSolved,
                ratingSpread,
                efficiency: Math.round(efficiency * 100) / 100,
                quickSolveRatio: Math.round(quickSolveRatio),
                contestRatio: Math.round(contestRatio),
                ratingDistribution: data.ratingCounts
            };
        });

        return stats.sort((a, b) => b.solved - a.solved);
    },

    /**
     * Estimate user's skill level with weighted moving average and multiple factors
     */
    estimateEnhancedSkillLevel(ratingDistribution, solvedProblems, solveTimeData, ratingHistory, userInfo, successByRating) {
        const buckets = ratingDistribution.buckets;

        if (buckets.length === 0) {
            return {
                estimated: 800,
                confidence: 'low',
                confidenceScore: 0.1,
                consistentAt: 800,
                peakSolved: 800,
                description: 'Beginner',
                factors: { message: 'Insufficient data' }
            };
        }

        // Factor 1: Weighted average of recent solves (exponential decay)
        const recentWeightedAvg = this.calculateRecentWeightedAverage(solvedProblems);

        // Factor 2: Rating where success rate is above 70%
        let consistentRating = 800;
        for (const [rating, data] of Object.entries(successByRating).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))) {
            if (data.total >= 3 && data.successRate >= 70) {
                consistentRating = Math.max(consistentRating, parseInt(rating));
            }
        }

        // Factor 3: Peak solved rating (with threshold of 3+ problems)
        let peakRating = 800;
        for (const bucket of buckets) {
            if (bucket.count >= 3) {
                peakRating = Math.max(peakRating, bucket.rating);
            }
        }

        // Factor 4: User's actual CF rating (if available)
        const cfRating = userInfo?.rating || null;
        const maxCfRating = userInfo?.maxRating || null;

        // Factor 5: Recent contest performance trend
        let contestTrend = 0;
        if (ratingHistory && ratingHistory.length >= 3) {
            const recent5 = ratingHistory.slice(-5);
            let trendSum = 0;
            for (let i = 1; i < recent5.length; i++) {
                trendSum += recent5[i].newRating - recent5[i].oldRating;
            }
            contestTrend = trendSum / (recent5.length - 1);
        }

        // Factor 6: Solve time analysis - find rating where quick solves dominate
        let comfortRating = 800;
        for (const data of solveTimeData) {
            // If solved quickly (under 20 mins) with 1-2 attempts, it's in comfort zone
            if (data.timeToSolve < 1200 && data.attempts <= 2) {
                comfortRating = Math.max(comfortRating, data.rating);
            }
        }

        // Calculate weighted estimated skill
        // Weights: recentWeightedAvg (0.30), consistentRating (0.25), cfRating (0.25), peakRating (0.20)
        let estimated;
        const factors = {
            recentWeightedAvg,
            consistentRating,
            peakRating,
            cfRating,
            comfortRating,
            contestTrend: Math.round(contestTrend)
        };

        if (cfRating) {
            // If user has CF rating, factor it in heavily
            estimated = Math.round(
                recentWeightedAvg * 0.25 +
                consistentRating * 0.20 +
                cfRating * 0.30 +
                peakRating * 0.15 +
                comfortRating * 0.10
            );
            // Adjust for recent trend
            estimated += Math.round(contestTrend * 0.1);
        } else {
            // No CF rating - rely on problem solving data
            estimated = Math.round(
                recentWeightedAvg * 0.35 +
                consistentRating * 0.30 +
                peakRating * 0.20 +
                comfortRating * 0.15
            );
        }

        // Round to nearest 100
        estimated = Math.round(estimated / 100) * 100;
        estimated = Math.max(800, Math.min(3500, estimated));

        // Calculate confidence score (0-1)
        let confidenceScore = 0;
        const totalSolved = solvedProblems.size;

        // More problems = more confidence
        confidenceScore += Math.min(0.3, totalSolved / 500);

        // Rating history adds confidence
        if (ratingHistory && ratingHistory.length > 0) {
            confidenceScore += Math.min(0.2, ratingHistory.length / 30);
        }

        // Diverse ratings add confidence
        const ratingDiversity = buckets.length;
        confidenceScore += Math.min(0.2, ratingDiversity / 15);

        // Recent activity adds confidence
        const recentSolves = this.countRecentSolves(solvedProblems, 30); // Last 30 days
        confidenceScore += Math.min(0.15, recentSolves / 50);

        // Contest participation adds confidence
        if (cfRating) confidenceScore += 0.15;

        let confidence = 'low';
        if (confidenceScore >= 0.7) confidence = 'high';
        else if (confidenceScore >= 0.4) confidence = 'medium';

        // Get description
        const description = this.getRatingDescription(estimated);

        return {
            estimated,
            confidence,
            confidenceScore: Math.round(confidenceScore * 100) / 100,
            consistentAt: consistentRating,
            peakSolved: Math.max(...buckets.map(b => b.rating)),
            comfortZone: comfortRating,
            weightedTop20: recentWeightedAvg,
            description,
            factors,
            cfRating,
            maxCfRating
        };
    },

    /**
     * Calculate weighted average of recent solved problems (exponential decay)
     */
    calculateRecentWeightedAverage(solvedProblems) {
        const problemsWithTime = [];

        for (const problem of solvedProblems.values()) {
            if (problem.rating && problem.solveTime) {
                problemsWithTime.push({
                    rating: problem.rating,
                    time: problem.solveTime
                });
            }
        }

        if (problemsWithTime.length === 0) return 800;

        // Sort by time (most recent first)
        problemsWithTime.sort((a, b) => b.time - a.time);

        // Take up to last 100 problems for weighted average
        const recent = problemsWithTime.slice(0, 100);

        let weightedSum = 0;
        let weightSum = 0;

        for (let i = 0; i < recent.length; i++) {
            // Exponential decay weight: more recent = higher weight
            const weight = Math.exp(-i * 0.05); // Decay factor
            weightedSum += recent[i].rating * weight;
            weightSum += weight;
        }

        return weightSum > 0 ? Math.round(weightedSum / weightSum) : 800;
    },

    /**
     * Count problems solved in the last N days
     */
    countRecentSolves(solvedProblems, days) {
        const cutoff = Date.now() / 1000 - (days * 24 * 60 * 60);
        let count = 0;

        for (const problem of solvedProblems.values()) {
            if (problem.solveTime && problem.solveTime > cutoff) {
                count++;
            }
        }

        return count;
    },

    /**
     * Analyze recent activity patterns
     */
    analyzeRecentActivity(solvedProblems) {
        const now = Date.now() / 1000;
        const weekAgo = now - (7 * 24 * 60 * 60);
        const monthAgo = now - (30 * 24 * 60 * 60);

        let lastWeek = 0;
        let lastMonth = 0;
        let lastSolveTime = 0;

        for (const problem of solvedProblems.values()) {
            if (problem.solveTime) {
                if (problem.solveTime > weekAgo) lastWeek++;
                if (problem.solveTime > monthAgo) lastMonth++;
                lastSolveTime = Math.max(lastSolveTime, problem.solveTime);
            }
        }

        const daysSinceLastSolve = lastSolveTime > 0
            ? Math.floor((now - lastSolveTime) / (24 * 60 * 60))
            : -1;

        return {
            lastWeek,
            lastMonth,
            daysSinceLastSolve,
            isActive: daysSinceLastSolve >= 0 && daysSinceLastSolve < 7
        };
    },

    /**
     * Get rating tier description
     */
    getRatingDescription(rating) {
        if (rating < 1200) return 'Newbie Level';
        if (rating < 1400) return 'Pupil Level';
        if (rating < 1600) return 'Specialist Level';
        if (rating < 1900) return 'Expert Level';
        if (rating < 2100) return 'Candidate Master Level';
        if (rating < 2300) return 'Master Level';
        if (rating < 2400) return 'International Master Level';
        if (rating < 2600) return 'Grandmaster Level';
        return 'Legendary Grandmaster Level';
    },

    /**
     * Identify weak topics with comparison to global distribution
     */
    identifyEnhancedWeakTopics(tagStats, skillLevel, globalDistribution) {
        if (tagStats.length === 0) return [];

        const totalSolved = tagStats.reduce((sum, t) => sum + t.solved, 0);
        const weakTopics = [];

        // Calculate user's tag distribution percentages
        const userDistribution = {};
        for (const stat of tagStats) {
            userDistribution[stat.tag] = (stat.solved / totalSolved) * 100;
        }

        for (const stat of tagStats) {
            const reasons = [];
            let weaknessScore = 0;
            const confidenceFactors = [];

            const userPct = userDistribution[stat.tag] || 0;
            const globalPct = globalDistribution[stat.tag] || 0;

            // Factor 1: Compare to global distribution - undertrained tag
            if (globalPct > 0 && userPct < globalPct * 0.5) {
                const deficit = Math.round((globalPct - userPct) * 10) / 10;
                reasons.push(`Undertrained: ${Math.round(userPct)}% vs ${Math.round(globalPct)}% global`);
                weaknessScore += Math.min(3, deficit / 2);
                confidenceFactors.push('Low exposure compared to typical problems');
            }

            // Factor 2: Low success rate indicates struggle
            if (stat.successRate < 65 && stat.attempted >= 3) {
                reasons.push(`Low success rate: ${stat.successRate}%`);
                weaknessScore += (100 - stat.successRate) / 20;
                confidenceFactors.push('Frequent failures on this topic');
            }

            // Factor 3: High attempt count per solve (efficiency problem)
            if (stat.efficiency > 2.5 && stat.solved >= 3) {
                reasons.push(`Many retries needed (${stat.efficiency} attempts/solve)`);
                weaknessScore += Math.min(2, stat.efficiency - 1);
                confidenceFactors.push('Takes multiple attempts to solve');
            }

            // Factor 4: Max rating solved is below skill level
            if (stat.maxRatingSolved > 0 && stat.maxRatingSolved < skillLevel.estimated - 200) {
                const gap = skillLevel.estimated - stat.maxRatingSolved;
                reasons.push(`Difficulty gap: max solved ${stat.maxRatingSolved} vs skill ${skillLevel.estimated}`);
                weaknessScore += Math.min(2, gap / 200);
                confidenceFactors.push('Cannot solve harder problems in this tag');
            }

            // Factor 5: Low quick solve ratio (spending too much time)
            if (stat.quickSolveRatio < 30 && stat.solved >= 5) {
                reasons.push(`Slow solves: only ${stat.quickSolveRatio}% solved quickly`);
                weaknessScore += 1;
                confidenceFactors.push('Problems take longer than expected');
            }

            // Factor 6: Narrow rating spread (not pushing difficulty)
            if (stat.ratingSpread < 200 && stat.solved >= 5 && stat.avgRating < skillLevel.estimated) {
                reasons.push(`Narrow practice range (${stat.ratingSpread} spread)`);
                weaknessScore += 1;
                confidenceFactors.push('Not challenging yourself in this topic');
            }

            // Only include if there's meaningful weakness
            if (weaknessScore >= 1.5 || (reasons.length >= 2 && weaknessScore >= 1)) {
                weakTopics.push({
                    tag: stat.tag,
                    solved: stat.solved,
                    attempted: stat.attempted,
                    successRate: stat.successRate,
                    avgRating: stat.avgRating,
                    maxRatingSolved: stat.maxRatingSolved,
                    reasons,
                    weaknessScore: Math.round(weaknessScore * 10) / 10,
                    confidenceFactors,
                    userPct: Math.round(userPct * 10) / 10,
                    globalPct: Math.round(globalPct * 10) / 10,
                    improvementPotential: this.calculateImprovementPotential(stat, skillLevel)
                });
            }
        }

        // Also check for completely missing important tags
        for (const tag of this.FOUNDATIONAL_TAGS) {
            if (!userDistribution[tag] || userDistribution[tag] < 0.5) {
                const globalPct = globalDistribution[tag] || 0;
                if (globalPct >= 2) { // Only flag if it's a common tag
                    weakTopics.push({
                        tag,
                        solved: 0,
                        attempted: 0,
                        successRate: 0,
                        avgRating: 0,
                        maxRatingSolved: 0,
                        reasons: [`Missing foundational skill: ${tag}`],
                        weaknessScore: 4,
                        confidenceFactors: ['No practice in this essential topic'],
                        userPct: 0,
                        globalPct: Math.round(globalPct * 10) / 10,
                        improvementPotential: 'very high'
                    });
                }
            }
        }

        // Sort by weakness score
        return weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);
    },

    /**
     * Calculate improvement potential for a tag
     */
    calculateImprovementPotential(tagStat, skillLevel) {
        let score = 0;

        // Higher potential if low success rate
        if (tagStat.successRate < 60) score += 2;
        else if (tagStat.successRate < 75) score += 1;

        // Higher potential if max rating is below skill
        if (tagStat.maxRatingSolved < skillLevel.estimated - 200) score += 2;
        else if (tagStat.maxRatingSolved < skillLevel.estimated) score += 1;

        // Higher potential if low practice count
        if (tagStat.solved < 10) score += 1;

        if (score >= 4) return 'very high';
        if (score >= 3) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
    },

    /**
     * Get enhanced focus topics with priority scoring
     */
    getEnhancedFocusTopics(tagStats, weakTopics, totalSolved, skillLevel) {
        const focusTopics = [];
        const solvedTags = new Set(tagStats.map(t => t.tag));
        const tagStatMap = new Map(tagStats.map(t => [t.tag, t]));

        // Priority 1: Missing or undertrained foundational skills
        for (const tag of this.FOUNDATIONAL_TAGS) {
            const stat = tagStatMap.get(tag);

            if (!stat || stat.solved < 5) {
                focusTopics.push({
                    tag,
                    reason: !stat
                        ? 'Essential topic - not practiced yet'
                        : `Essential topic - only ${stat.solved} problems solved`,
                    priority: 'critical',
                    category: 'foundational',
                    suggestedCount: 10 - (stat?.solved || 0),
                    confidence: 'high',
                    whyImportant: `${tag} appears in ${Math.round(this.GLOBAL_TAG_DISTRIBUTION[tag] || 0)}% of CF problems`
                });
            } else if (stat.successRate < 60 && stat.attempted >= 3) {
                focusTopics.push({
                    tag,
                    reason: `Low success rate (${stat.successRate}%) in foundational topic`,
                    priority: 'high',
                    category: 'foundational-weakness',
                    suggestedCount: 10,
                    confidence: 'high',
                    whyImportant: 'Must master fundamentals before advancing'
                });
            }
        }

        // Priority 2: High-impact weak topics
        for (const weak of weakTopics.slice(0, 7)) {
            if (!focusTopics.find(f => f.tag === weak.tag)) {
                const isFoundational = this.FOUNDATIONAL_TAGS.includes(weak.tag);
                focusTopics.push({
                    tag: weak.tag,
                    reason: weak.reasons.slice(0, 2).join('; '),
                    priority: weak.weaknessScore >= 4 ? 'high' : 'medium',
                    category: isFoundational ? 'foundational-weakness' : 'weakness',
                    suggestedCount: Math.ceil(10 * (weak.weaknessScore / 5)),
                    confidence: weak.confidenceFactors.length >= 2 ? 'high' : 'medium',
                    improvementPotential: weak.improvementPotential
                });
            }
        }

        // Priority 3: Learning bridges (topics to explore based on strengths)
        const strongTags = tagStats
            .filter(t => t.solved >= 10 && t.successRate >= 80)
            .map(t => t.tag);

        const relatedTags = this.findRelatedTags(strongTags);
        for (const tag of relatedTags) {
            const stat = tagStatMap.get(tag);
            if (!stat || stat.solved < 5) {
                if (!focusTopics.find(f => f.tag === tag)) {
                    focusTopics.push({
                        tag,
                        reason: `Related to your strong areas: ${strongTags.slice(0, 2).join(', ')}`,
                        priority: 'low',
                        category: 'expansion',
                        suggestedCount: 5,
                        confidence: 'medium',
                        whyImportant: 'Natural progression from your existing skills'
                    });
                }
            }
        }

        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        focusTopics.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return focusTopics.slice(0, 10);
    },

    /**
     * Find related tags based on common co-occurrence in problems
     */
    findRelatedTags(strongTags) {
        const tagRelations = {
            'dp': ['bitmasks', 'trees', 'graphs', 'combinatorics'],
            'graphs': ['dfs and similar', 'trees', 'shortest paths', 'dsu'],
            'data structures': ['trees', 'binary search', 'two pointers'],
            'math': ['number theory', 'combinatorics', 'geometry'],
            'binary search': ['two pointers', 'data structures', 'sortings'],
            'greedy': ['sortings', 'two pointers', 'constructive algorithms'],
            'trees': ['dfs and similar', 'dp', 'data structures'],
            'dfs and similar': ['graphs', 'trees', 'dsu'],
            'strings': ['hashing', 'string suffix structures', 'dp'],
            'implementation': ['brute force', 'constructive algorithms', 'sortings']
        };

        const related = new Set();
        for (const tag of strongTags) {
            const relations = tagRelations[tag] || [];
            relations.forEach(r => related.add(r));
        }

        // Remove tags that are already strong
        strongTags.forEach(t => related.delete(t));

        return Array.from(related);
    },

    /**
     * Calculate dynamic rating range based on success rate
     */
    calculateDynamicRatingRange(skillLevel, successByRating) {
        const current = skillLevel.estimated;

        // Find the highest rating with >= 70% success rate (comfort zone upper bound)
        let comfortMax = current;
        for (const [rating, data] of Object.entries(successByRating)) {
            if (data.total >= 3 && data.successRate >= 70) {
                comfortMax = Math.max(comfortMax, parseInt(rating));
            }
        }

        // Find the lowest rating with < 50% success rate (struggle zone start)
        let struggleStart = current + 400;
        for (const [rating, data] of Object.entries(successByRating)) {
            if (data.total >= 2 && data.successRate < 50) {
                struggleStart = Math.min(struggleStart, parseInt(rating));
            }
        }

        // Calculate optimal target based on 70-80% success zone
        const targetMin = Math.max(800, comfortMax);
        const targetMax = Math.min(struggleStart - 100, comfortMax + 200);

        return {
            comfort: {
                min: Math.max(800, current - 200),
                max: comfortMax,
                description: 'Comfort zone - high success rate, good for confidence'
            },
            target: {
                min: targetMin,
                max: Math.max(targetMin, targetMax),
                description: 'Target range - optimal for steady improvement (70-80% success)'
            },
            challenge: {
                min: Math.min(struggleStart, current + 200),
                max: Math.min(3500, struggleStart + 200),
                description: 'Challenge range - push your limits (expect 40-60% success)'
            },
            struggle: {
                min: struggleStart,
                max: Math.min(3500, struggleStart + 300),
                description: 'Struggle zone - difficult but builds resilience'
            },
            overall: {
                min: Math.max(800, current - 100),
                max: Math.min(3500, current + 300)
            }
        };
    },

    /**
     * Calculate difficulty progression recommendation
     */
    calculateDifficultyProgression(successByRating, skillLevel) {
        const current = skillLevel.estimated;

        // Calculate average success rate at current level
        const currentLevelData = successByRating[current] || { successRate: 50, total: 0 };
        const aboveLevelData = successByRating[current + 100] || { successRate: 0, total: 0 };
        const belowLevelData = successByRating[current - 100] || { successRate: 100, total: 0 };

        let recommendation = 'maintain';
        let nextStep = current;
        let confidence = 'medium';
        let reasoning = [];

        // Rule: If success rate >= 80% with at least 5 problems, suggest moving up
        if (currentLevelData.successRate >= 80 && currentLevelData.total >= 5) {
            recommendation = 'increase';
            nextStep = current + 100;
            confidence = 'high';
            reasoning.push(`${currentLevelData.successRate}% success rate at ${current} - ready to advance`);
        }
        // Rule: If success rate >= 70% at current and already solving above
        else if (currentLevelData.successRate >= 70 && aboveLevelData.total >= 3 && aboveLevelData.successRate >= 50) {
            recommendation = 'increase';
            nextStep = current + 100;
            confidence = 'medium';
            reasoning.push(`Handling ${current + 100} rated problems well`);
        }
        // Rule: If success rate < 50%, suggest stepping down
        else if (currentLevelData.successRate < 50 && currentLevelData.total >= 3) {
            recommendation = 'decrease';
            nextStep = current - 100;
            confidence = 'high';
            reasoning.push(`Only ${currentLevelData.successRate}% success at ${current} - build more foundation`);
        }
        // Rule: If struggling at current but comfortable below
        else if (currentLevelData.successRate < 60 && belowLevelData.successRate >= 80 && belowLevelData.total >= 5) {
            recommendation = 'consolidate';
            nextStep = current - 100;
            confidence = 'medium';
            reasoning.push('Consolidate skills before advancing');
        }
        else {
            reasoning.push(`Current success rate: ${currentLevelData.successRate}% - continue practicing at this level`);
        }

        return {
            recommendation,
            currentLevel: current,
            nextStep,
            confidence,
            reasoning,
            successRateAtCurrent: currentLevelData.successRate,
            problemsAtCurrent: currentLevelData.total,
            optimalRange: {
                min: recommendation === 'decrease' ? nextStep : current,
                max: recommendation === 'increase' ? nextStep + 100 : current + 100
            }
        };
    },

    /**
     * Identify comfort and struggle zones precisely
     */
    identifyZones(successByRating, skillLevel) {
        const zones = {
            comfort: [],     // >= 80% success
            learning: [],    // 60-80% success
            challenging: [], // 40-60% success
            struggle: []     // < 40% success
        };

        for (const [rating, data] of Object.entries(successByRating)) {
            if (data.total < 2) continue; // Need minimum data

            const ratingNum = parseInt(rating);
            const entry = { rating: ratingNum, successRate: data.successRate, count: data.total };

            if (data.successRate >= 80) {
                zones.comfort.push(entry);
            } else if (data.successRate >= 60) {
                zones.learning.push(entry);
            } else if (data.successRate >= 40) {
                zones.challenging.push(entry);
            } else {
                zones.struggle.push(entry);
            }
        }

        // Sort each zone by rating
        for (const zone of Object.values(zones)) {
            zone.sort((a, b) => a.rating - b.rating);
        }

        // Calculate zone boundaries
        const comfortMax = zones.comfort.length > 0
            ? Math.max(...zones.comfort.map(z => z.rating))
            : skillLevel.estimated - 200;

        const struggleMin = zones.struggle.length > 0
            ? Math.min(...zones.struggle.map(z => z.rating))
            : skillLevel.estimated + 400;

        return {
            ...zones,
            summary: {
                comfortCeiling: comfortMax,
                struggleFloor: struggleMin,
                optimalPracticeRange: {
                    min: comfortMax,
                    max: Math.min(comfortMax + 200, struggleMin - 100)
                }
            }
        };
    },

    /**
     * Get specific problem recommendations with multi-factor scoring
     */
    async getRecommendedProblems(userAnalysis, count = 6) {
        const { problems, problemStatistics } = await Api.fetchProblems();

        // Build problem stats map
        const statsMap = new Map();
        if (problemStatistics) {
            problemStatistics.forEach(stat => {
                statsMap.set(`${stat.contestId}-${stat.index}`, stat);
            });
        }

        const solvedIds = new Set(userAnalysis.solvedProblems.map(
            p => `${p.contestId}-${p.index}`
        ));

        // Get recently solved for diversity check
        const recentSolvedTags = new Set();
        const recentSolvedContests = new Set();
        const sortedSolved = [...userAnalysis.solvedProblems]
            .sort((a, b) => (b.solveTime || 0) - (a.solveTime || 0))
            .slice(0, 20);

        for (const p of sortedSolved) {
            (p.tags || []).forEach(t => recentSolvedTags.add(t));
            recentSolvedContests.add(p.contestId);
        }

        const skillLevel = userAnalysis.skillLevel.estimated;
        const focusTags = userAnalysis.focusTopics.map(t => t.tag);
        const weakTags = userAnalysis.weakTopics.map(t => t.tag);
        const strongTagStats = userAnalysis.tagStats
            .filter(t => t.solved >= 10 && t.successRate >= 75)
            .map(t => t.tag);

        // Filter unsolved problems with rating
        const unsolved = problems.filter(p => {
            const id = `${p.contestId}-${p.index}`;
            return !solvedIds.has(id) && p.rating;
        });

        // Score problems for recommendation
        const scoredProblems = unsolved.map(problem => {
            let score = 0;
            const reasons = [];
            const confidenceFactors = [];
            const problemId = `${problem.contestId}-${problem.index}`;
            const stats = statsMap.get(problemId) || {};
            const problemTags = problem.tags || [];

            // Factor 1: Rating relevance (0-35 points)
            const ratingDiff = problem.rating - skillLevel;
            if (ratingDiff >= 0 && ratingDiff <= 100) {
                score += 35;
                reasons.push('Optimal difficulty for improvement');
                confidenceFactors.push('Right at your growth edge');
            } else if (ratingDiff > 100 && ratingDiff <= 200) {
                score += 28;
                reasons.push('Good challenge level');
            } else if (ratingDiff > 200 && ratingDiff <= 300) {
                score += 18;
                reasons.push('Stretch goal');
            } else if (ratingDiff >= -100 && ratingDiff < 0) {
                score += 22;
                reasons.push('Confidence builder');
            } else if (ratingDiff >= -200 && ratingDiff < -100) {
                score += 12;
                reasons.push('Review level');
            }

            // Factor 2: Focus/weak tag relevance (0-30 points)
            let focusTagCount = 0;
            let weakTagCount = 0;
            let strongTagCount = 0;

            for (const tag of problemTags) {
                if (focusTags.includes(tag)) focusTagCount++;
                if (weakTags.includes(tag)) weakTagCount++;
                if (strongTagStats.includes(tag)) strongTagCount++;
            }

            if (focusTagCount > 0) {
                score += Math.min(25, focusTagCount * 12);
                reasons.push(`Covers ${focusTagCount} focus topic(s)`);
                confidenceFactors.push('Directly addresses your improvement areas');
            }

            if (weakTagCount > 0) {
                score += Math.min(15, weakTagCount * 8);
                reasons.push(`Targets ${weakTagCount} weak area(s)`);
            }

            // Factor 3: Learning bridge bonus (weak + strong tag combination)
            if (weakTagCount > 0 && strongTagCount > 0) {
                score += 15;
                reasons.push('Learning bridge: combines weak & strong topics');
                confidenceFactors.push('Leverage existing skills to learn new ones');
            }

            // Factor 4: Problem quality (solve count as proxy) (0-15 points)
            const solveCount = stats.solvedCount || 0;
            if (solveCount >= 5000) {
                score += 15;
                reasons.push('Popular, well-tested problem');
                confidenceFactors.push('Clear problem statement likely');
            } else if (solveCount >= 2000) {
                score += 12;
                reasons.push('Well-attempted problem');
            } else if (solveCount >= 500) {
                score += 8;
                reasons.push('Reasonably popular');
            } else if (solveCount < 100) {
                score -= 5; // Penalize very obscure problems
            }

            // Factor 5: Diversity penalty (avoid recent similar content)
            let diversityPenalty = 0;
            if (recentSolvedContests.has(problem.contestId)) {
                diversityPenalty += 10;
            }

            const recentTagOverlap = problemTags.filter(t => recentSolvedTags.has(t)).length;
            if (recentTagOverlap === problemTags.length && problemTags.length > 0) {
                diversityPenalty += 8; // All tags recently practiced
            }

            score -= diversityPenalty;
            if (diversityPenalty > 0) {
                reasons.push('Similar to recent practice');
            }

            // Factor 6: Recency bonus (newer problems often better quality)
            if (problem.contestId >= 1800) {
                score += 5;
            } else if (problem.contestId >= 1500) {
                score += 3;
            }

            // Calculate confidence score for this recommendation
            const confidenceScore = this.calculateRecommendationConfidence(
                score,
                reasons.length,
                confidenceFactors.length,
                ratingDiff,
                focusTagCount
            );

            return {
                problem,
                score,
                reasons,
                confidenceFactors,
                confidenceScore,
                matchedTags: problemTags.filter(t => focusTags.includes(t) || weakTags.includes(t)),
                solveCount
            };
        });

        // Sort by score
        scoredProblems.sort((a, b) => b.score - a.score);

        // Get diverse recommendations
        const recommendations = [];
        const usedContests = new Set();
        const usedTagCombinations = new Set();

        for (const sp of scoredProblems) {
            if (recommendations.length >= count) break;

            // Skip if same contest already included
            if (usedContests.has(sp.problem.contestId)) continue;

            // Skip if very similar tag combination already included
            const tagKey = [...(sp.problem.tags || [])].sort().join(',');
            if (usedTagCombinations.has(tagKey) && recommendations.length >= 2) continue;

            usedContests.add(sp.problem.contestId);
            usedTagCombinations.add(tagKey);

            // Generate explanation for why this problem is recommended
            const explanation = this.generateRecommendationExplanation(sp, skillLevel, userAnalysis);

            recommendations.push({
                ...sp.problem,
                url: `https://codeforces.com/problemset/problem/${sp.problem.contestId}/${sp.problem.index}`,
                recommendationScore: sp.score,
                reasons: sp.reasons,
                confidenceScore: sp.confidenceScore,
                confidenceLevel: sp.confidenceScore >= 0.7 ? 'high' : sp.confidenceScore >= 0.4 ? 'medium' : 'low',
                explanation,
                matchedTags: sp.matchedTags,
                solveCount: sp.solveCount
            });
        }

        return recommendations;
    },

    /**
     * Calculate confidence score for a recommendation
     */
    calculateRecommendationConfidence(score, reasonCount, confidenceFactorCount, ratingDiff, focusTagCount) {
        let confidence = 0;

        // Base confidence from score
        confidence += Math.min(0.4, score / 100);

        // Bonus for multiple reasons
        confidence += Math.min(0.2, reasonCount * 0.05);

        // Bonus for confidence factors
        confidence += Math.min(0.2, confidenceFactorCount * 0.1);

        // Bonus for optimal rating range
        if (Math.abs(ratingDiff) <= 100) {
            confidence += 0.15;
        } else if (Math.abs(ratingDiff) <= 200) {
            confidence += 0.08;
        }

        // Bonus for focus tag match
        if (focusTagCount >= 1) confidence += 0.1;
        if (focusTagCount >= 2) confidence += 0.05;

        return Math.min(1, Math.round(confidence * 100) / 100);
    },

    /**
     * Generate human-readable explanation for recommendation
     */
    generateRecommendationExplanation(scoredProblem, skillLevel, userAnalysis) {
        const { problem, reasons, matchedTags, confidenceScore } = scoredProblem;
        const ratingDiff = problem.rating - skillLevel;

        let explanation = '';

        // Rating context
        if (ratingDiff >= 0 && ratingDiff <= 100) {
            explanation += `This ${problem.rating}-rated problem is slightly above your estimated skill level (${skillLevel}), making it ideal for growth. `;
        } else if (ratingDiff > 100 && ratingDiff <= 200) {
            explanation += `At ${problem.rating}, this is a challenging problem that will push your limits. `;
        } else if (ratingDiff >= -100 && ratingDiff < 0) {
            explanation += `This ${problem.rating}-rated problem is within your comfort zone - good for building confidence. `;
        }

        // Tag context
        if (matchedTags.length > 0) {
            const tagList = matchedTags.slice(0, 3).join(', ');
            explanation += `It covers ${tagList}, which ${matchedTags.length > 1 ? 'are' : 'is'} identified as area(s) for improvement. `;
        }

        // Quality context
        if (scoredProblem.solveCount >= 5000) {
            explanation += `With ${scoredProblem.solveCount.toLocaleString()}+ solves, it's a well-tested problem with clear expectations.`;
        }

        return explanation.trim();
    },

    /**
     * Generate practice guide HTML content with enhanced features
     */
    generatePracticeGuideHTML(analysis) {
        const {
            skillLevel,
            recommendedRange,
            focusTopics,
            weakTopics,
            ratingDistribution,
            difficultyProgression,
            zones,
            recentActivity
        } = analysis;

        // Build rating chart data
        const chartBars = ratingDistribution.buckets.map(b => {
            const maxCount = Math.max(...ratingDistribution.buckets.map(x => x.count));
            const height = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
            const isTarget = b.rating >= recommendedRange.target.min && b.rating <= recommendedRange.target.max;
            const isComfort = b.rating <= zones.summary.comfortCeiling;
            const isStruggle = b.rating >= zones.summary.struggleFloor;

            let barClass = '';
            if (isTarget) barClass = 'target';
            else if (isComfort) barClass = 'comfort';
            else if (isStruggle) barClass = 'struggle';

            return `
                <div class="chart-bar-container" title="${b.rating}: ${b.count} problems">
                    <div class="chart-bar ${barClass}" style="height: ${height}%"></div>
                    <span class="chart-label">${b.rating}</span>
                </div>
            `;
        }).join('');

        // Build focus topics list with enhanced info
        const focusTopicsList = focusTopics.slice(0, 5).map(topic => `
            <div class="focus-topic-item ${topic.priority}">
                <div class="focus-topic-header">
                    <span class="focus-tag">${topic.tag}</span>
                    <span class="focus-priority-badge ${topic.priority}">${topic.priority}</span>
                </div>
                <span class="focus-reason">${topic.reason}</span>
                ${topic.whyImportant ? `<span class="focus-importance">${topic.whyImportant}</span>` : ''}
                ${topic.suggestedCount ? `<span class="focus-suggestion">Suggested: ${topic.suggestedCount} more problems</span>` : ''}
            </div>
        `).join('');

        // Build difficulty progression recommendation
        const progressionIcon = {
            'increase': '\u2191',  // Up arrow
            'decrease': '\u2193',  // Down arrow
            'maintain': '\u2194',  // Left-right arrow
            'consolidate': '\u21BB' // Circular arrow
        };

        const progressionClass = {
            'increase': 'progression-up',
            'decrease': 'progression-down',
            'maintain': 'progression-stable',
            'consolidate': 'progression-consolidate'
        };

        const progressionHTML = `
            <div class="difficulty-progression ${progressionClass[difficultyProgression.recommendation]}">
                <div class="progression-header">
                    <span class="progression-icon">${progressionIcon[difficultyProgression.recommendation]}</span>
                    <span class="progression-title">
                        ${difficultyProgression.recommendation === 'increase' ? 'Ready to Level Up!' :
                          difficultyProgression.recommendation === 'decrease' ? 'Consolidate Basics' :
                          difficultyProgression.recommendation === 'consolidate' ? 'Strengthen Foundation' :
                          'Keep Practicing'}
                    </span>
                    <span class="progression-confidence ${difficultyProgression.confidence}">${difficultyProgression.confidence} confidence</span>
                </div>
                <div class="progression-details">
                    <p>${difficultyProgression.reasoning.join(' ')}</p>
                    <div class="progression-range">
                        <span>Optimal range: </span>
                        <strong>${difficultyProgression.optimalRange.min} - ${difficultyProgression.optimalRange.max}</strong>
                    </div>
                </div>
            </div>
        `;

        // Activity indicator
        const activityHTML = recentActivity ? `
            <div class="activity-indicator ${recentActivity.isActive ? 'active' : 'inactive'}">
                <span class="activity-dot"></span>
                <span class="activity-text">
                    ${recentActivity.isActive
                        ? `Active: ${recentActivity.lastWeek} solves this week`
                        : `Last active: ${recentActivity.daysSinceLastSolve} days ago`}
                </span>
            </div>
        ` : '';

        // Zones summary
        const zonesHTML = `
            <div class="zones-summary">
                <div class="zone-item comfort">
                    <span class="zone-label">Comfort Zone</span>
                    <span class="zone-range">Up to ${zones.summary.comfortCeiling}</span>
                </div>
                <div class="zone-item optimal">
                    <span class="zone-label">Growth Zone</span>
                    <span class="zone-range">${zones.summary.optimalPracticeRange.min} - ${zones.summary.optimalPracticeRange.max}</span>
                </div>
                <div class="zone-item struggle">
                    <span class="zone-label">Struggle Zone</span>
                    <span class="zone-range">${zones.summary.struggleFloor}+</span>
                </div>
            </div>
        `;

        return `
            <div class="practice-guide">
                <div class="guide-header">
                    <h3>Your Practice Guide</h3>
                    <div class="guide-badges">
                        <span class="confidence-badge ${skillLevel.confidence}">${skillLevel.confidence} confidence</span>
                        ${activityHTML}
                    </div>
                </div>

                <div class="guide-stats">
                    <div class="guide-stat">
                        <div class="stat-icon level-icon"></div>
                        <div class="stat-content">
                            <span class="stat-title">Estimated Level</span>
                            <span class="stat-main">${skillLevel.estimated}</span>
                            <span class="stat-sub">${skillLevel.description}</span>
                            ${skillLevel.cfRating ? `<span class="stat-cf-rating">CF Rating: ${skillLevel.cfRating}</span>` : ''}
                        </div>
                    </div>

                    <div class="guide-stat">
                        <div class="stat-icon target-icon"></div>
                        <div class="stat-content">
                            <span class="stat-title">Target Range</span>
                            <span class="stat-main">${recommendedRange.target.min} - ${recommendedRange.target.max}</span>
                            <span class="stat-sub">${recommendedRange.target.description}</span>
                        </div>
                    </div>

                    <div class="guide-stat">
                        <div class="stat-icon peak-icon"></div>
                        <div class="stat-content">
                            <span class="stat-title">Peak Solved</span>
                            <span class="stat-main">${skillLevel.peakSolved}</span>
                            <span class="stat-sub">Comfort ceiling: ${skillLevel.comfortZone || skillLevel.consistentAt}</span>
                        </div>
                    </div>
                </div>

                ${progressionHTML}

                ${zonesHTML}

                <div class="rating-chart">
                    <h4>Your Rating Distribution</h4>
                    <div class="chart-container">
                        ${chartBars}
                    </div>
                    <div class="chart-legend">
                        <span class="legend-item comfort">Comfort Zone</span>
                        <span class="legend-item target">Target Range</span>
                        <span class="legend-item struggle">Challenge Area</span>
                    </div>
                </div>

                <div class="focus-topics-section">
                    <h4>Focus Topics</h4>
                    <p class="section-description">Practice these topics to improve faster:</p>
                    <div class="focus-topics-list">
                        ${focusTopicsList || '<p>Complete more problems to get personalized recommendations</p>'}
                    </div>
                </div>

                <div class="guide-actions">
                    <button id="apply-recommended-settings" class="btn-primary">
                        Apply Recommended Settings
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Generate recommended problems HTML with confidence scores
     */
    generateRecommendedProblemsHTML(problems) {
        if (!problems || problems.length === 0) {
            return '<p class="no-recommendations">No specific recommendations available yet. Solve more problems to get personalized suggestions!</p>';
        }

        const problemCards = problems.map(problem => {
            const confidenceBar = `
                <div class="confidence-bar-container" title="Recommendation confidence: ${Math.round(problem.confidenceScore * 100)}%">
                    <div class="confidence-bar" style="width: ${problem.confidenceScore * 100}%"></div>
                </div>
            `;

            const explanationHTML = problem.explanation
                ? `<div class="rec-problem-explanation">${problem.explanation}</div>`
                : '';

            return `
                <div class="recommended-problem-card">
                    <div class="rec-problem-header">
                        <span class="rec-problem-id">${problem.contestId}${problem.index}</span>
                        <span class="rec-problem-rating">${problem.rating}</span>
                        <span class="rec-confidence-badge ${problem.confidenceLevel}">${problem.confidenceLevel}</span>
                    </div>
                    <div class="rec-problem-name">${problem.name}</div>
                    ${confidenceBar}
                    <div class="rec-problem-tags">
                        ${(problem.tags || []).slice(0, 4).map(t =>
                            `<span class="${problem.matchedTags?.includes(t) ? 'matched' : ''}">${t}</span>`
                        ).join('')}
                    </div>
                    <div class="rec-problem-reasons">
                        ${problem.reasons?.slice(0, 3).map(r => `<span class="reason">${r}</span>`).join('') || ''}
                    </div>
                    ${explanationHTML}
                    <div class="rec-problem-footer">
                        ${problem.solveCount ? `<span class="solve-count">${problem.solveCount.toLocaleString()} solved</span>` : ''}
                        <a href="${problem.url}" target="_blank" class="rec-problem-link">Solve This</a>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="recommended-problems">
                <h4>Recommended Problems</h4>
                <p class="section-description">Hand-picked problems based on your profile analysis:</p>
                <div class="recommended-problems-grid">
                    ${problemCards}
                </div>
            </div>
        `;
    }
};
