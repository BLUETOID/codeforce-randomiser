// Profile Page module - Dedicated profile page with heatmap and graphs

const ProfilePage = {
    initialized: false,
    profileData: null,
    ratingHistory: [],
    submissionData: null,

    /**
     * Initialize the profile page
     */
    async init() {
        if (this.initialized && this.profileData) {
            // Already initialized with data
            return;
        }

        // Check if we have a saved handle
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

        // Wire up events
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
            // Save handle for future sessions
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

        // Show loading state
        container.innerHTML = `
            <div class="profile-loading">
                <div class="spinner"></div>
                <p>Loading profile data...</p>
            </div>
        `;

        try {
            // Fetch all data in parallel
            const [userInfo, submissions, ratingHistory] = await Promise.all([
                Api.fetchUserInfo(handle),
                Api.fetchUserSubmissions(handle),
                Api.fetchUserRatingHistory(handle).catch(() => [])
            ]);

            this.profileData = userInfo;
            this.ratingHistory = ratingHistory;
            this.submissionData = submissions;
            this.initialized = true;

            // Render the full profile page
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

        // Process submission data for heatmap
        const heatmapData = this.processSubmissionsForHeatmap(submissions);
        const progressData = this.processProgressData(submissions, ratingHistory);
        const solvedByRating = Api.analyzeSolvedByRating(submissions);
        const solvedByTags = Api.analyzeSolvedByTags(submissions);

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
                        <span class="quick-stat-label">Problems Solved</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-value">${ratingHistory.length}</span>
                        <span class="quick-stat-label">Contests</span>
                    </div>
                </div>
                <button id="profile-change-btn" class="btn-secondary">Change Profile</button>
            </div>

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
                <div class="tags-chart">
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

        // Count submissions per day
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

        // Calculate streaks
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

        // Current streak counts only if the most recent active day is today or yesterday
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
        // Monthly activity
        const monthlyActivity = {};
        const solvedByMonth = {};

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

        // Convert sets to counts
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

        // Find the first Sunday before or on oneYearAgo
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // Calculate max count for level calculation
        const maxCount = Math.max(...Object.values(heatmapData.dailyCounts), 1);

        // Generate weeks
        let html = '<div class="heatmap-months">';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let currentMonth = -1;

        // Generate grid
        html += '</div><div class="heatmap-grid">';
        html += '<div class="heatmap-days"><span>Mon</span><span>Wed</span><span>Fri</span></div>';
        html += '<div class="heatmap-weeks">';

        let weekHtml = '';
        let weekCount = 0;
        const currentDate = new Date(startDate);

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const count = heatmapData.dailyCounts[dateStr] || 0;
            const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);

            // Start new week on Sunday
            if (currentDate.getDay() === 0 && weekHtml) {
                html += `<div class="heatmap-week">${weekHtml}</div>`;
                weekHtml = '';
                weekCount++;
            }

            const tooltip = `${dateStr}: ${count} submission${count !== 1 ? 's' : ''}`;
            weekHtml += `<div class="heatmap-day level-${level}" title="${tooltip}" data-date="${dateStr}"></div>`;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add remaining days
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

        // Generate SVG
        let svg = `<svg viewBox="0 0 ${width} ${height}" class="rating-svg">`;

        // Background gradient zones for rating levels
        const ratingZones = [
            { min: 0, max: 1200, color: 'rgba(128, 128, 128, 0.1)' },      // Gray
            { min: 1200, max: 1400, color: 'rgba(0, 128, 0, 0.1)' },       // Green
            { min: 1400, max: 1600, color: 'rgba(3, 168, 158, 0.1)' },     // Cyan
            { min: 1600, max: 1900, color: 'rgba(0, 0, 255, 0.1)' },       // Blue
            { min: 1900, max: 2100, color: 'rgba(170, 0, 170, 0.1)' },     // Purple
            { min: 2100, max: 2400, color: 'rgba(255, 140, 0, 0.1)' },     // Orange
            { min: 2400, max: 4000, color: 'rgba(255, 0, 0, 0.1)' }        // Red
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
            svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#ddd" stroke-dasharray="3,3" />`;
            svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#666" font-size="12">${rating}</text>`;
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
        svg += `<path d="${pathD}" fill="none" stroke="#3498db" stroke-width="2" />`;

        // Draw points
        for (const point of points) {
            const color = getRankColor(this.getRankFromRating(point.contest.newRating));
            const tooltip = `${point.contest.contestName}: ${point.contest.newRating} (${point.contest.newRating > point.contest.oldRating ? '+' : ''}${point.contest.newRating - point.contest.oldRating})`;
            svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" stroke="white" stroke-width="2">
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
