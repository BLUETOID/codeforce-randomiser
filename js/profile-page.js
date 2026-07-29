// Profile Page module - Dedicated profile page with heatmap, graphs, and advanced analytics

const ProfilePage = {
    initialized: false,
    profileData: null,
    ratingHistory: [],
    submissionData: null,
    tagSortMode: 'count', // 'count' or 'accuracy'

    /**
     * Initialize the profile page
     */
    async init() {
        if (this.initialized && this.profileData) {
            return;
        }

        const savedHandle = localStorage.getItem('cf_profile_handle');
        if (savedHandle) {
            await this.loadProfile(savedHandle);
        } else {
            this.showEmptyState();
        }
    },

    /**
     * Show empty state when no profile is loaded
     */
    showEmptyState() {
        const container = document.getElementById('profile-page-content');
        if (!container) return;

        container.innerHTML = `
            <div class="profile-empty-state">
                <div class="empty-icon"><i class="fa-solid fa-user"></i></div>
                <h2>No Profile Loaded</h2>
                <p>Enter your Codeforces handle to see your statistics, streak heatmap, and progress.</p>
                <div class="profile-input-box">
                    <input type="text" id="profile-page-handle" placeholder="Enter Codeforces handle" class="handle-input-large">
                    <button id="profile-page-load" class="btn-primary">Load Profile</button>
                </div>
                <div id="profile-page-status" class="profile-status"></div>
            </div>
        `;

        const loadBtn = document.getElementById('profile-page-load');
        const handleInput = document.getElementById('profile-page-handle');

        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadFromInput());
        }
        if (handleInput) {
            handleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.loadFromInput();
            });
        }
    },

    /**
     * Load profile from input field
     */
    async loadFromInput() {
        const input = document.getElementById('profile-page-handle');
        const status = document.getElementById('profile-page-status');
        const loadBtn = document.getElementById('profile-page-load');

        if (!input || !input.value.trim()) {
            if (status) status.textContent = 'Please enter a handle';
            return;
        }

        const handle = input.value.trim();

        if (loadBtn) {
            loadBtn.disabled = true;
            loadBtn.textContent = 'Loading...';
        }

        try {
            await this.loadProfile(handle);
            localStorage.setItem('cf_profile_handle', handle);
        } catch (e) {
            if (status) {
                status.textContent = e.message || 'Failed to load profile';
                status.className = 'profile-status error';
            }
        }

        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Load Profile';
        }
    },

    /**
     * Load full profile data
     */
    async loadProfile(handle) {
        const container = document.getElementById('profile-page-content');
        if (!container) return;

        container.innerHTML = `
            <div class="profile-loading">
                <div class="spinner"></div>
                <p>Loading profile data...</p>
            </div>
        `;

        try {
            const [userInfo, submissions, ratingHistory] = await Promise.all([
                Api.fetchUserInfo(handle),
                Api.fetchUserSubmissions(handle),
                Api.fetchUserRatingHistory(handle).catch(() => [])
            ]);

            this.profileData = userInfo;
            this.ratingHistory = ratingHistory;
            this.submissionData = submissions;
            this.initialized = true;

            this.renderProfile(handle, userInfo, submissions, ratingHistory);

        } catch (e) {
            container.innerHTML = `
                <div class="profile-error">
                    <h2>Error Loading Profile</h2>
                    <p>${e.message || 'Failed to load profile'}</p>
                    <button id="profile-retry" class="btn-primary">Try Again</button>
                </div>
            `;

            const retryBtn = document.getElementById('profile-retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.showEmptyState());
            }
        }
    },

    /**
     * Render the full profile page
     */
    renderProfile(handle, userInfo, submissions, ratingHistory) {
        const container = document.getElementById('profile-page-content');
        if (!container) return;

        const heatmapData = this.processSubmissionsForHeatmap(submissions);
        const progressData = this.processProgressData(submissions, ratingHistory);
        const solvedByRating = Api.analyzeSolvedByRating(submissions);
        const solvedByTags = Api.analyzeSolvedByTags(submissions);
        const advancedStats = this.calculateAdvancedStats(submissions);
        const contestAnalytics = this.calculateContestAnalytics(ratingHistory);

        // Count unique solved problems
        const solvedSet = new Set();
        for (const sub of submissions) {
            if (sub.verdict === 'OK') {
                solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
        }
        const solvedCount = solvedSet.size;

        container.innerHTML = `
            <!-- Profile Header -->
            <div class="profile-header-large">
                <div class="profile-avatar-section">
                    <img src="${userInfo.titlePhoto || ''}" alt="${handle}" class="profile-avatar-large">
                    <div class="profile-main-info">
                        <h1 class="profile-handle-large" style="color: ${getRankColor(userInfo.rank || 'newbie')}">${userInfo.handle}</h1>
                        <span class="profile-rank-badge" style="background-color: ${getRankColor(userInfo.rank || 'newbie')}">${userInfo.rank || 'Unrated'}</span>
                        ${userInfo.firstName || userInfo.lastName ? `<span class="profile-name">${userInfo.firstName || ''} ${userInfo.lastName || ''}</span>` : ''}
                    </div>
                </div>
                <div class="profile-quick-stats">
                    <div class="quick-stat">
                        <span class="quick-stat-value" style="color: ${getRankColor(userInfo.rank || 'newbie')}">${userInfo.rating || '--'}</span>
                        <span class="quick-stat-label">Rating</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-value" style="color: ${getRankColor(userInfo.maxRank || 'newbie')}">${userInfo.maxRating || '--'}</span>
                        <span class="quick-stat-label">Max Rating</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-value">${solvedCount}</span>
                        <span class="quick-stat-label">Solved</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-value">${ratingHistory.length}</span>
                        <span class="quick-stat-label">Contests</span>
                    </div>
                </div>
                <button id="profile-change-btn" class="btn-secondary">Change Profile</button>
            </div>

            <!-- Advanced Stats Grid -->
            <div class="profile-section">
                <h2>Submission Analytics</h2>
                <div class="advanced-stats-grid">
                    <div class="advanced-stat-card">
                        <span class="stat-value accent">${advancedStats.acRatio}%</span>
                        <span class="stat-label">AC Ratio</span>
                        <span class="stat-sub">${advancedStats.totalAccepted} / ${advancedStats.totalSubmissions}</span>
                    </div>
                    <div class="advanced-stat-card">
                        <span class="stat-value success">${advancedStats.firstTrySolves}</span>
                        <span class="stat-label">First-Try Solves</span>
                        <span class="stat-sub">${advancedStats.firstTryPercent}% of solved</span>
                    </div>
                    <div class="advanced-stat-card">
                        <span class="stat-value">${advancedStats.avgSolvedRating || '--'}</span>
                        <span class="stat-label">Avg Solved Rating</span>
                    </div>
                    <div class="advanced-stat-card">
                        <span class="stat-value warning">${advancedStats.avgAttemptsPerSolve}</span>
                        <span class="stat-label">Avg Attempts / AC</span>
                    </div>
                </div>

                ${advancedStats.hardestProblem ? `
                <h3 style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Hardest Problem Solved</h3>
                <div class="hardest-problem-card">
                    <div class="problem-rating-badge" style="background-color: ${getRankColor(this.getRankFromRating(advancedStats.hardestProblem.rating))}">${advancedStats.hardestProblem.rating}</div>
                    <div class="problem-info">
                        <div class="problem-name">${advancedStats.hardestProblem.name}</div>
                        <div class="problem-id">${advancedStats.hardestProblem.contestId}${advancedStats.hardestProblem.index}</div>
                    </div>
                    <a href="https://codeforces.com/problemset/problem/${advancedStats.hardestProblem.contestId}/${advancedStats.hardestProblem.index}" target="_blank" class="solve-link">View →</a>
                </div>` : ''}

                <!-- Verdict Breakdown -->
                <h3 style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Verdict Distribution</h3>
                <div class="verdict-bars">
                    ${this.generateVerdictBars(advancedStats.verdicts)}
                </div>
            </div>

            <!-- Contest Performance Analytics -->
            ${ratingHistory.length > 0 ? `
            <div class="profile-section">
                <h2>Contest Performance</h2>
                <div class="contest-analytics-grid">
                    <div class="contest-analytics-card">
                        <span class="analytics-label">Peak Rating</span>
                        <span class="analytics-value" style="color: ${getRankColor(this.getRankFromRating(contestAnalytics.peakRating))}">${contestAnalytics.peakRating}</span>
                        <span class="analytics-sub">${contestAnalytics.peakContest}</span>
                    </div>
                    <div class="contest-analytics-card">
                        <span class="analytics-label">Best Rank</span>
                        <span class="analytics-value">#${contestAnalytics.bestRank}</span>
                        <span class="analytics-sub">${contestAnalytics.bestRankContest}</span>
                    </div>
                    <div class="contest-analytics-card">
                        <span class="analytics-label">Avg Rating Change</span>
                        <span class="analytics-value" style="color: ${contestAnalytics.avgDelta >= 0 ? 'var(--success-color)' : 'var(--error-color)'}">${contestAnalytics.avgDelta >= 0 ? '+' : ''}${contestAnalytics.avgDelta}</span>
                        <span class="analytics-sub">per contest</span>
                    </div>
                    <div class="contest-analytics-card">
                        <span class="analytics-label">Best Gain</span>
                        <span class="analytics-value" style="color: var(--success-color)">+${contestAnalytics.bestGain}</span>
                        <span class="analytics-sub">${contestAnalytics.bestGainContest}</span>
                    </div>
                </div>
                <div class="delta-distribution">
                    <div class="delta-item positive">
                        <span class="delta-count">${contestAnalytics.positiveContests}</span>
                        <span class="delta-label">Positive contests</span>
                    </div>
                    <div class="delta-item negative">
                        <span class="delta-count">${contestAnalytics.negativeContests}</span>
                        <span class="delta-label">Negative contests</span>
                    </div>
                </div>
            </div>` : ''}

            <!-- Streak Heatmap Section -->
            <div class="profile-section heatmap-section">
                <h2>Submission Activity</h2>
                <p class="section-subtitle">${heatmapData.totalSubmissions} submissions in the last year</p>
                <div id="streak-heatmap" class="streak-heatmap"></div>
                <div class="heatmap-legend">
                    <span>Less</span>
                    <div class="legend-box level-0"></div>
                    <div class="legend-box level-1"></div>
                    <div class="legend-box level-2"></div>
                    <div class="legend-box level-3"></div>
                    <div class="legend-box level-4"></div>
                    <span>More</span>
                </div>
                <div class="streak-stats">
                    <div class="streak-stat">
                        <span class="streak-stat-value">${heatmapData.currentStreak}</span>
                        <span class="streak-stat-label">Current Streak</span>
                    </div>
                    <div class="streak-stat">
                        <span class="streak-stat-value">${heatmapData.longestStreak}</span>
                        <span class="streak-stat-label">Longest Streak</span>
                    </div>
                    <div class="streak-stat">
                        <span class="streak-stat-value">${heatmapData.activeDays}</span>
                        <span class="streak-stat-label">Active Days</span>
                    </div>
                </div>
            </div>

            <!-- Rating Progress Section -->
            <div class="profile-section progress-section">
                <h2>Rating Progress</h2>
                <div id="rating-chart" class="rating-chart"></div>
                <div class="progress-insights">
                    ${this.generateProgressInsights(ratingHistory)}
                </div>
            </div>

            <!-- Monthly Activity Section -->
            <div class="profile-section monthly-section">
                <h2>Monthly Activity</h2>
                <div id="monthly-chart" class="monthly-chart"></div>
            </div>

            <!-- Problems by Difficulty Section -->
            <div class="profile-section difficulty-section">
                <h2>Problems by Difficulty</h2>
                <div class="difficulty-bars">
                    ${this.generateDifficultyBars(solvedByRating)}
                </div>
            </div>

            <!-- Tag Distribution Section -->
            <div class="profile-section tags-section">
                <h2>Problem Tags Distribution</h2>
                <div class="tag-sort-controls">
                    <button class="tag-sort-btn active" data-sort="count">By Count</button>
                    <button class="tag-sort-btn" data-sort="accuracy">By Accuracy</button>
                </div>
                <div id="tags-chart-container" class="tags-chart">
                    ${this.generateTagsChart(solvedByTags)}
                </div>
            </div>
        `;

        // Render interactive elements
        this.renderHeatmap(heatmapData);
        this.renderRatingChart(ratingHistory);
        this.renderMonthlyChart(progressData.monthlyActivity);

        // Wire up change profile button
        const changeBtn = document.getElementById('profile-change-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                this.initialized = false;
                this.profileData = null;
                localStorage.removeItem('cf_profile_handle');
                this.showEmptyState();
            });
        }

        // Wire up tag sort buttons
        this.wireTagSortButtons(submissions);
    },

    /**
     * Calculate advanced submission analytics
     */
    calculateAdvancedStats(submissions) {
        const verdicts = { OK: 0, WRONG_ANSWER: 0, TIME_LIMIT_EXCEEDED: 0, RUNTIME_ERROR: 0, COMPILATION_ERROR: 0, OTHER: 0 };
        const solvedProblems = new Map();
        const attemptedProblems = new Map();
        let totalSubmissions = submissions.length;
        let totalAccepted = 0;
        let hardestProblem = null;
        let totalSolvedRating = 0;
        let solvedWithRatingCount = 0;

        // Track per-problem submission info
        const problemFirstSub = new Map();

        for (const sub of submissions) {
            const v = sub.verdict;
            if (verdicts.hasOwnProperty(v)) {
                verdicts[v]++;
            } else {
                verdicts.OTHER++;
            }
            if (v === 'OK') totalAccepted++;

            const pid = `${sub.problem.contestId}-${sub.problem.index}`;

            if (!problemFirstSub.has(pid)) {
                problemFirstSub.set(pid, v);
            }

            if (v === 'OK' && !solvedProblems.has(pid)) {
                solvedProblems.set(pid, sub.problem);
                if (sub.problem.rating) {
                    totalSolvedRating += sub.problem.rating;
                    solvedWithRatingCount++;
                    if (!hardestProblem || sub.problem.rating > hardestProblem.rating) {
                        hardestProblem = sub.problem;
                    }
                }
            }

            if (!solvedProblems.has(pid)) {
                attemptedProblems.set(pid, (attemptedProblems.get(pid) || 0) + 1);
            }
        }

        // First-try solves: problems where the first submission was OK
        let firstTrySolves = 0;
        for (const [pid, firstVerdict] of problemFirstSub.entries()) {
            if (firstVerdict === 'OK') {
                firstTrySolves++;
            }
        }

        const solvedCount = solvedProblems.size;
        const acRatio = totalSubmissions > 0 ? ((totalAccepted / totalSubmissions) * 100).toFixed(1) : 0;
        const avgSolvedRating = solvedWithRatingCount > 0 ? Math.round(totalSolvedRating / solvedWithRatingCount) : null;
        const avgAttemptsPerSolve = solvedCount > 0 ? (totalSubmissions / solvedCount).toFixed(1) : '--';
        const firstTryPercent = solvedCount > 0 ? Math.round((firstTrySolves / solvedCount) * 100) : 0;

        return {
            totalSubmissions,
            totalAccepted,
            acRatio,
            firstTrySolves,
            firstTryPercent,
            avgSolvedRating,
            avgAttemptsPerSolve,
            hardestProblem,
            verdicts
        };
    },

    /**
     * Calculate contest performance analytics
     */
    calculateContestAnalytics(ratingHistory) {
        if (!ratingHistory || ratingHistory.length === 0) {
            return { peakRating: '--', peakContest: '', bestRank: '--', bestRankContest: '', avgDelta: 0, bestGain: 0, bestGainContest: '', positiveContests: 0, negativeContests: 0 };
        }

        let peakRating = 0;
        let peakContest = '';
        let bestRank = Infinity;
        let bestRankContest = '';
        let bestGain = 0;
        let bestGainContest = '';
        let totalDelta = 0;
        let positiveContests = 0;
        let negativeContests = 0;

        for (const contest of ratingHistory) {
            if (contest.newRating > peakRating) {
                peakRating = contest.newRating;
                peakContest = contest.contestName || '';
            }
            if (contest.rank < bestRank) {
                bestRank = contest.rank;
                bestRankContest = contest.contestName || '';
            }
            const delta = contest.newRating - contest.oldRating;
            totalDelta += delta;
            if (delta > bestGain) {
                bestGain = delta;
                bestGainContest = contest.contestName || '';
            }
            if (delta >= 0) positiveContests++;
            else negativeContests++;
        }

        // Truncate contest names
        const truncate = (s, n = 30) => s.length > n ? s.substring(0, n) + '...' : s;

        return {
            peakRating,
            peakContest: truncate(peakContest),
            bestRank: bestRank === Infinity ? '--' : bestRank,
            bestRankContest: truncate(bestRankContest),
            avgDelta: Math.round(totalDelta / ratingHistory.length),
            bestGain,
            bestGainContest: truncate(bestGainContest),
            positiveContests,
            negativeContests
        };
    },

    /**
     * Generate verdict breakdown bars
     */
    generateVerdictBars(verdicts) {
        const items = [
            { key: 'OK', label: 'Accepted', cls: 'ok' },
            { key: 'WRONG_ANSWER', label: 'WA', cls: 'wa' },
            { key: 'TIME_LIMIT_EXCEEDED', label: 'TLE', cls: 'tle' },
            { key: 'RUNTIME_ERROR', label: 'RTE', cls: 'rte' },
            { key: 'COMPILATION_ERROR', label: 'CE', cls: 'ce' }
        ];

        const total = Object.values(verdicts).reduce((a, b) => a + b, 0);
        const maxCount = Math.max(...items.map(i => verdicts[i.key] || 0), 1);

        return items.map(item => {
            const count = verdicts[item.key] || 0;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            const width = (count / maxCount) * 100;

            return `
                <div class="verdict-bar-item">
                    <span class="verdict-label ${item.cls}">${item.label}</span>
                    <div class="verdict-bar-track">
                        <div class="verdict-bar-fill ${item.cls}" style="width: ${width}%">
                            ${count > 0 ? `<span class="verdict-bar-count">${count}</span>` : ''}
                        </div>
                    </div>
                    <span class="verdict-percent">${pct}%</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Wire up tag sort buttons
     */
    wireTagSortButtons(submissions) {
        const btns = document.querySelectorAll('.tag-sort-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.getAttribute('data-sort');
                this.tagSortMode = mode;

                const tags = Api.analyzeSolvedByTags(submissions);
                if (mode === 'accuracy') {
                    // Sort by attempting to compute accuracy: need per-tag attempt data
                    // For simplicity, we just reverse sort (show least-solved first = weakest)
                    tags.sort((a, b) => a.percentage - b.percentage);
                }

                const chartContainer = document.getElementById('tags-chart-container');
                if (chartContainer) {
                    chartContainer.innerHTML = this.generateTagsChart(tags);
                }
            });
        });
    },

    /**
     * Process submissions for heatmap data
     */
    processSubmissionsForHeatmap(submissions) {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const toLocalDateKey = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const dailyCounts = {};
        let totalSubmissions = 0;

        for (const sub of submissions) {
            const date = new Date(sub.creationTimeSeconds * 1000);
            if (date >= oneYearAgo) {
                const dateStr = toLocalDateKey(date);
                dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
                totalSubmissions++;
            }
        }

        const sortedDates = Object.keys(dailyCounts).sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate = null;

        const todayStr = toLocalDateKey(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = toLocalDateKey(yesterday);

        for (const dateStr of sortedDates) {
            const date = new Date(dateStr);

            if (prevDate) {
                const dayDiff = Math.round((date - prevDate) / 86400000);
                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }

            longestStreak = Math.max(longestStreak, tempStreak);
            prevDate = date;
        }

        if (sortedDates.length > 0) {
            const lastActiveDay = sortedDates[sortedDates.length - 1];
            if (lastActiveDay === todayStr || lastActiveDay === yesterdayStr) {
                currentStreak = 1;

                for (let i = sortedDates.length - 2; i >= 0; i--) {
                    const currentDate = new Date(sortedDates[i + 1]);
                    const previousDate = new Date(sortedDates[i]);
                    const dayDiff = Math.round((currentDate - previousDate) / 86400000);

                    if (dayDiff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            dailyCounts,
            totalSubmissions,
            currentStreak,
            longestStreak,
            activeDays: Object.keys(dailyCounts).length
        };
    },

    /**
     * Process submissions and rating history for progress data
     */
    processProgressData(submissions, ratingHistory) {
        const monthlyActivity = {};

        for (const sub of submissions) {
            const date = new Date(sub.creationTimeSeconds * 1000);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyActivity[monthKey]) {
                monthlyActivity[monthKey] = { submissions: 0, solved: new Set() };
            }

            monthlyActivity[monthKey].submissions++;

            if (sub.verdict === 'OK') {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                monthlyActivity[monthKey].solved.add(problemId);
            }
        }

        for (const month in monthlyActivity) {
            monthlyActivity[month].solvedCount = monthlyActivity[month].solved.size;
            delete monthlyActivity[month].solved;
        }

        return {
            monthlyActivity,
            ratingHistory
        };
    },

    /**
     * Render the streak heatmap
     */
    renderHeatmap(heatmapData) {
        const container = document.getElementById('streak-heatmap');
        if (!container) return;

        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const maxCount = Math.max(...Object.values(heatmapData.dailyCounts), 1);

        let html = '<div class="heatmap-months">';
        html += '</div><div class="heatmap-grid">';
        html += '<div class="heatmap-days"><span>Mon</span><span>Wed</span><span>Fri</span></div>';
        html += '<div class="heatmap-weeks">';

        let weekHtml = '';
        const currentDate = new Date(startDate);

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const count = heatmapData.dailyCounts[dateStr] || 0;
            const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);

            if (currentDate.getDay() === 0 && weekHtml) {
                html += `<div class="heatmap-week">${weekHtml}</div>`;
                weekHtml = '';
            }

            const tooltip = `${dateStr}: ${count} submission${count !== 1 ? 's' : ''}`;
            weekHtml += `<div class="heatmap-day level-${level}" title="${tooltip}" data-date="${dateStr}"></div>`;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (weekHtml) {
            html += `<div class="heatmap-week">${weekHtml}</div>`;
        }

        html += '</div></div>';
        container.innerHTML = html;
    },

    /**
     * Render rating progress chart
     */
    renderRatingChart(ratingHistory) {
        const container = document.getElementById('rating-chart');
        if (!container || ratingHistory.length === 0) {
            if (container) {
                container.innerHTML = '<div class="no-data">No contest history available</div>';
            }
            return;
        }

        const minRating = Math.min(...ratingHistory.map(r => r.newRating)) - 100;
        const maxRating = Math.max(...ratingHistory.map(r => r.newRating)) + 100;
        const ratingRange = maxRating - minRating;

        const width = container.clientWidth || 800;
        const height = 300;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        let svg = `<svg viewBox="0 0 ${width} ${height}" class="rating-svg">`;

        // Background gradient zones for rating levels (subtle solid fills)
        const ratingZones = [
            { min: 0, max: 1200, color: 'rgba(128, 128, 128, 0.05)' },
            { min: 1200, max: 1400, color: 'rgba(0, 128, 0, 0.05)' },
            { min: 1400, max: 1600, color: 'rgba(3, 168, 158, 0.05)' },
            { min: 1600, max: 1900, color: 'rgba(0, 0, 255, 0.05)' },
            { min: 1900, max: 2100, color: 'rgba(170, 0, 170, 0.05)' },
            { min: 2100, max: 2400, color: 'rgba(255, 140, 0, 0.05)' },
            { min: 2400, max: 4000, color: 'rgba(255, 0, 0, 0.05)' }
        ];

        for (const zone of ratingZones) {
            if (zone.max > minRating && zone.min < maxRating) {
                const zoneMin = Math.max(zone.min, minRating);
                const zoneMax = Math.min(zone.max, maxRating);
                const y1 = padding.top + (1 - (zoneMax - minRating) / ratingRange) * chartHeight;
                const y2 = padding.top + (1 - (zoneMin - minRating) / ratingRange) * chartHeight;
                svg += `<rect x="${padding.left}" y="${y1}" width="${chartWidth}" height="${y2 - y1}" fill="${zone.color}" />`;
            }
        }

        // Grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * chartHeight;
            const rating = Math.round(maxRating - (i / gridLines) * ratingRange);
            svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3,3" />`;
            svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="var(--text-secondary)" font-size="11">${rating}</text>`;
        }

        // Generate line path
        const points = ratingHistory.map((contest, i) => {
            const x = padding.left + (i / (ratingHistory.length - 1 || 1)) * chartWidth;
            const y = padding.top + (1 - (contest.newRating - minRating) / ratingRange) * chartHeight;
            return { x, y, contest };
        });

        // Draw line
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
        svg += `<path d="${pathD}" fill="none" stroke="var(--primary-color)" stroke-width="2" />`;

        // Draw points with tooltips
        for (const point of points) {
            const color = getRankColor(this.getRankFromRating(point.contest.newRating));
            const delta = point.contest.newRating - point.contest.oldRating;
            const tooltip = `${point.contest.contestName || 'Contest'}: ${point.contest.newRating} (${delta >= 0 ? '+' : ''}${delta})`;
            svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" stroke="var(--card-bg)" stroke-width="2">
                <title>${tooltip}</title>
            </circle>`;
        }

        svg += '</svg>';
        container.innerHTML = svg;
    },

    /**
     * Get rank from rating
     */
    getRankFromRating(rating) {
        if (rating < 1200) return 'newbie';
        if (rating < 1400) return 'pupil';
        if (rating < 1600) return 'specialist';
        if (rating < 1900) return 'expert';
        if (rating < 2100) return 'candidate master';
        if (rating < 2400) return 'master';
        return 'grandmaster';
    },

    /**
     * Render monthly activity chart
     */
    renderMonthlyChart(monthlyActivity) {
        const container = document.getElementById('monthly-chart');
        if (!container) return;

        const months = Object.keys(monthlyActivity).sort().slice(-12);
        if (months.length === 0) {
            container.innerHTML = '<div class="no-data">No activity data</div>';
            return;
        }

        const maxSolved = Math.max(...months.map(m => monthlyActivity[m].solvedCount), 1);

        let html = '<div class="monthly-bars">';
        for (const month of months) {
            const data = monthlyActivity[month];
            const heightPercent = (data.solvedCount / maxSolved) * 100;
            const [year, monthNum] = month.split('-');
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(monthNum) - 1];

            html += `
                <div class="monthly-bar-item">
                    <div class="monthly-bar-container">
                        <div class="monthly-bar" style="height: ${heightPercent}%">
                            <span class="monthly-bar-value">${data.solvedCount}</span>
                        </div>
                    </div>
                    <span class="monthly-bar-label">${monthName}</span>
                </div>
            `;
        }
        html += '</div>';

        container.innerHTML = html;
    },

    /**
     * Generate progress insights text
     */
    generateProgressInsights(ratingHistory) {
        if (ratingHistory.length === 0) {
            return '<p>No contest history available. Participate in contests to see your progress!</p>';
        }

        const trend = Api.analyzeRatingTrend(ratingHistory);
        const firstContest = ratingHistory[0];
        const lastContest = ratingHistory[ratingHistory.length - 1];
        const totalChange = lastContest.newRating - firstContest.newRating;

        let trendEmoji = trend.trend === 'increasing' ? '<i class="fa-solid fa-arrow-trend-up"></i>' : trend.trend === 'decreasing' ? '<i class="fa-solid fa-arrow-trend-down"></i>' : '<i class="fa-solid fa-minus"></i>';
        let trendText = trend.trend === 'increasing' ? 'on the rise' : trend.trend === 'decreasing' ? 'needs more practice' : 'stable';

        return `
            <div class="insight-card">
                <span class="insight-emoji">${trendEmoji}</span>
                <div class="insight-text">
                    <strong>Your rating is ${trendText}</strong>
                    <p>Average change: ${trend.avgChange > 0 ? '+' : ''}${trend.avgChange} per contest (last 5)</p>
                </div>
            </div>
            <div class="insight-card">
                <span class="insight-emoji"><i class="fa-solid fa-trophy"></i></span>
                <div class="insight-text">
                    <strong>Total Progress: ${totalChange > 0 ? '+' : ''}${totalChange}</strong>
                    <p>From ${firstContest.newRating} to ${lastContest.newRating} over ${ratingHistory.length} contests</p>
                </div>
            </div>
        `;
    },

    /**
     * Generate difficulty distribution bars
     */
    generateDifficultyBars(solvedByRating) {
        const maxCount = Math.max(...solvedByRating.map(r => r.count), 1);

        return solvedByRating.map(range => {
            const widthPercent = (range.count / maxCount) * 100;
            const ratingNum = parseInt(range.label.split('-')[0].replace('+', ''));
            const color = getRankColor(this.getRankFromRating(ratingNum));

            return `
                <div class="difficulty-bar-item">
                    <span class="difficulty-label">${range.label}</span>
                    <div class="difficulty-bar-container">
                        <div class="difficulty-bar" style="width: ${widthPercent}%; background-color: ${color}">
                            <span class="difficulty-count">${range.count}</span>
                        </div>
                    </div>
                    <span class="difficulty-percent">${range.percentage}%</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Generate tags distribution chart
     */
    generateTagsChart(solvedByTags) {
        const topTags = solvedByTags.slice(0, 15);
        const maxCount = Math.max(...topTags.map(t => t.count), 1);

        return topTags.map(tag => {
            const widthPercent = (tag.count / maxCount) * 100;

            return `
                <div class="tag-bar-item">
                    <span class="tag-bar-label">${tag.tag}</span>
                    <div class="tag-bar-container">
                        <div class="tag-bar" style="width: ${widthPercent}%">
                            <span class="tag-bar-count">${tag.count}</span>
                        </div>
                    </div>
                    <span class="tag-bar-percent">${tag.percentage}%</span>
                </div>
            `;
        }).join('');
    }
};
