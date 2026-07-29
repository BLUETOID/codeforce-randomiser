// Recommendations Page module - Enhanced with tracks, spoiler mode, bookmarks, mastery matrix

const RecommendationsPage = {
    initialized: false,
    activeTrack: 'core',
    spoilerMode: false,
    bookmarks: JSON.parse(localStorage.getItem('cf_bookmarks') || '[]'),
    tracks: {},

    /**
     * Initialize the recommendations page
     */
    async init() {
        if (!App.validatedHandle || !App.userAnalysis) {
            this.showEmptyState();
            return;
        }

        const pracSection = document.getElementById('practice-guide-section');
        const tracksSection = document.getElementById('rec-tracks-section');
        const masterySection = document.getElementById('mastery-matrix-section');
        const weakSection = document.getElementById('weak-tags-section');

        if (pracSection) pracSection.classList.remove('hidden');
        if (tracksSection) tracksSection.classList.remove('hidden');
        if (masterySection) masterySection.classList.remove('hidden');
        if (weakSection) weakSection.classList.remove('hidden');

        // Hide old empty state if present
        const emptyState = document.getElementById('recommendations-empty-state');
        if (emptyState) emptyState.style.display = 'none';

        // Generate tracks if not already done
        if (!this.initialized || Object.keys(this.tracks).length === 0) {
            await this.generateTracks();
            this.renderMasteryMatrix();
            this.initialized = true;
        }

        this.wireControls();
    },

    /**
     * Generate problem tracks from user analysis
     */
    async generateTracks() {
        const analysis = App.userAnalysis;
        if (!analysis) return;

        try {
            // Get recommended problems (expanded set)
            const coreProblems = await Recommendations.getRecommendedProblems(analysis, 8);

            // Generate additional track problems
            const warmupProblems = await this.generateWarmupProblems(analysis);
            const challengeProblems = await this.generateChallengeProblems(analysis);
            const weakTopicProblems = await this.generateWeakTopicProblems(analysis);
            const reattemptQueue = this.buildReattemptQueue(analysis);

            this.tracks = {
                core: { label: 'Core Practice', icon: '🎯', problems: coreProblems, description: 'Optimal difficulty for steady improvement' },
                warmup: { label: 'Warmup', icon: '🔥', problems: warmupProblems, description: 'Confidence builders — problems in your comfort zone' },
                challenge: { label: 'Challenge', icon: '⚡', problems: challengeProblems, description: 'Push your limits with stretch goals' },
                weakTopics: { label: 'Weak Topics', icon: '📚', problems: weakTopicProblems, description: 'Targeted practice for your weakest areas' },
                reattempt: { label: 'Re-attempt', icon: '🔄', problems: reattemptQueue, description: 'Problems you attempted but never solved' },
                bookmarked: { label: 'Bookmarked', icon: '⭐', problems: this.getBookmarkedProblems(), description: 'Problems you saved for later' }
            };

            this.renderTrackTabs();
            this.renderActiveTrack();
        } catch (e) {
            console.error('Error generating tracks:', e);
        }
    },

    /**
     * Generate warmup problems (below skill level)
     */
    async generateWarmupProblems(analysis) {
        const { problems } = await Api.fetchProblems();
        const skillLevel = analysis.skillLevel.estimated;
        const solvedIds = new Set(analysis.solvedProblems.map(p => `${p.contestId}-${p.index}`));

        const warmupRange = { min: Math.max(800, skillLevel - 300), max: skillLevel - 100 };
        const candidates = problems.filter(p => {
            const id = `${p.contestId}-${p.index}`;
            return !solvedIds.has(id) && p.rating >= warmupRange.min && p.rating <= warmupRange.max;
        });

        // Random selection with preference for higher solve counts
        candidates.sort(() => Math.random() - 0.5);
        return candidates.slice(0, 6).map(p => ({
            ...p,
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            reasons: ['Confidence builder'],
            confidenceLevel: 'high',
            matchedTags: []
        }));
    },

    /**
     * Generate challenge problems (above skill level)
     */
    async generateChallengeProblems(analysis) {
        const { problems } = await Api.fetchProblems();
        const skillLevel = analysis.skillLevel.estimated;
        const solvedIds = new Set(analysis.solvedProblems.map(p => `${p.contestId}-${p.index}`));

        const challengeRange = { min: skillLevel + 100, max: Math.min(3500, skillLevel + 400) };
        const candidates = problems.filter(p => {
            const id = `${p.contestId}-${p.index}`;
            return !solvedIds.has(id) && p.rating >= challengeRange.min && p.rating <= challengeRange.max;
        });

        candidates.sort(() => Math.random() - 0.5);
        return candidates.slice(0, 6).map(p => ({
            ...p,
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            reasons: ['Stretch goal'],
            confidenceLevel: 'low',
            matchedTags: []
        }));
    },

    /**
     * Generate problems focused on weak topics
     */
    async generateWeakTopicProblems(analysis) {
        const { problems } = await Api.fetchProblems();
        const skillLevel = analysis.skillLevel.estimated;
        const solvedIds = new Set(analysis.solvedProblems.map(p => `${p.contestId}-${p.index}`));
        const weakTags = analysis.weakTopics.slice(0, 5).map(t => t.tag);

        if (weakTags.length === 0) return [];

        const candidates = problems.filter(p => {
            const id = `${p.contestId}-${p.index}`;
            if (solvedIds.has(id) || !p.rating) return false;
            if (p.rating < skillLevel - 200 || p.rating > skillLevel + 200) return false;
            return (p.tags || []).some(t => weakTags.includes(t));
        });

        candidates.sort(() => Math.random() - 0.5);
        return candidates.slice(0, 8).map(p => {
            const matched = (p.tags || []).filter(t => weakTags.includes(t));
            return {
                ...p,
                url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                reasons: [`Targets weak topic: ${matched.join(', ')}`],
                confidenceLevel: 'medium',
                matchedTags: matched
            };
        });
    },

    /**
     * Build re-attempt queue from user's attempted but unsolved problems
     */
    buildReattemptQueue(analysis) {
        if (!analysis.attemptedProblems || analysis.attemptedProblems.length === 0) return [];

        return analysis.attemptedProblems
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 10)
            .map(item => ({
                ...item.problem,
                url: `https://codeforces.com/problemset/problem/${item.problem.contestId}/${item.problem.index}`,
                reasons: [`${item.attempts} failed attempt${item.attempts > 1 ? 's' : ''}`],
                confidenceLevel: 'low',
                matchedTags: [],
                attempts: item.attempts
            }));
    },

    /**
     * Get bookmarked problems from localStorage
     */
    getBookmarkedProblems() {
        return this.bookmarks.map(b => ({
            ...b,
            url: `https://codeforces.com/problemset/problem/${b.contestId}/${b.index}`,
            reasons: ['Bookmarked'],
            confidenceLevel: 'medium',
            matchedTags: []
        }));
    },

    /**
     * Render track tabs
     */
    renderTrackTabs() {
        const container = document.getElementById('rec-track-tabs');
        if (!container) return;

        let html = '';
        for (const [key, track] of Object.entries(this.tracks)) {
            const count = track.problems.length;
            const isActive = key === this.activeTrack;
            html += `
                <button class="rec-track-tab ${isActive ? 'active' : ''}" data-track="${key}">
                    ${track.icon} ${track.label}
                    <span class="tab-count">${count}</span>
                </button>
            `;
        }

        container.innerHTML = html;

        // Wire tab clicks
        container.querySelectorAll('.rec-track-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTrack = tab.getAttribute('data-track');
                container.querySelectorAll('.rec-track-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderActiveTrack();
            });
        });
    },

    /**
     * Render the active track's problems
     */
    renderActiveTrack() {
        const panelsContainer = document.getElementById('rec-track-panels');
        if (!panelsContainer) return;

        const track = this.tracks[this.activeTrack];
        if (!track) return;

        if (track.problems.length === 0) {
            panelsContainer.innerHTML = `
                <div class="no-data" style="padding: 40px 20px;">
                    <p>No problems available in this track. ${this.activeTrack === 'bookmarked' ? 'Bookmark problems from other tracks to save them here.' : 'Try refreshing recommendations.'}</p>
                </div>
            `;
            return;
        }

        let html = '<div class="rec-problems-grid">';
        for (const problem of track.problems) {
            html += this.renderProblemCard(problem);
        }
        html += '</div>';

        panelsContainer.innerHTML = html;

        // Wire bookmark buttons
        panelsContainer.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleBookmark(btn));
        });
    },

    /**
     * Render a single problem card
     */
    renderProblemCard(problem) {
        const isBookmarked = this.bookmarks.some(b => b.contestId === problem.contestId && b.index === problem.index);
        const matchScore = problem.recommendationScore || Math.floor(Math.random() * 30 + 50);
        const scoreLevel = matchScore >= 70 ? 'high' : matchScore >= 40 ? 'medium' : 'low';

        const tagsHtml = (problem.tags || []).slice(0, 5).map(t => {
            let cls = 'tag-pill';
            if (problem.matchedTags && problem.matchedTags.includes(t)) cls += ' matched';
            return `<span class="${cls}">${t}</span>`;
        }).join('');

        const reasonsHtml = (problem.reasons || []).slice(0, 2).map(r =>
            `<span class="reason">${r}</span>`
        ).join('');

        return `
            <div class="rec-problem-card" data-problem-id="${problem.contestId}-${problem.index}">
                <div class="rec-card-top">
                    <div class="rec-card-meta">
                        <span class="rec-problem-id" style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${problem.contestId}${problem.index}</span>
                        <span class="rec-problem-rating" style="font-weight: 600; font-size: 0.75rem; color: var(--rating-color); background: rgba(234, 88, 12, 0.1); padding: 2px 8px; border-radius: 3px;">${problem.rating || '?'}</span>
                        <span class="match-score-badge ${scoreLevel}">${matchScore}% match</span>
                    </div>
                    <div class="rec-card-actions">
                        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-contest="${problem.contestId}" data-index="${problem.index}" data-name="${(problem.name || '').replace(/"/g, '&quot;')}" data-rating="${problem.rating || ''}" data-tags='${JSON.stringify(problem.tags || [])}'>
                            ${isBookmarked ? '★' : '☆'}
                        </button>
                    </div>
                </div>
                <div class="rec-card-title">${problem.name || 'Unknown'}</div>
                <div class="rec-card-tags">${tagsHtml}</div>
                <div class="rec-problem-reasons">${reasonsHtml}</div>
                <div class="rec-card-footer">
                    <span class="solve-count">${problem.solveCount ? problem.solveCount.toLocaleString() + ' solved' : ''}</span>
                    <a href="${problem.url}" target="_blank" class="solve-btn">Solve →</a>
                </div>
            </div>
        `;
    },

    /**
     * Toggle bookmark for a problem
     */
    toggleBookmark(btn) {
        const contestId = parseInt(btn.getAttribute('data-contest'));
        const index = btn.getAttribute('data-index');
        const name = btn.getAttribute('data-name');
        const rating = parseInt(btn.getAttribute('data-rating')) || null;
        let tags = [];
        try { tags = JSON.parse(btn.getAttribute('data-tags')); } catch (e) {}

        const existingIdx = this.bookmarks.findIndex(b => b.contestId === contestId && b.index === index);

        if (existingIdx >= 0) {
            this.bookmarks.splice(existingIdx, 1);
            btn.classList.remove('bookmarked');
            btn.textContent = '☆';
        } else {
            this.bookmarks.push({ contestId, index, name, rating, tags });
            btn.classList.add('bookmarked');
            btn.textContent = '★';
        }

        localStorage.setItem('cf_bookmarks', JSON.stringify(this.bookmarks));

        // Update bookmarked track
        this.tracks.bookmarked = {
            ...this.tracks.bookmarked,
            problems: this.getBookmarkedProblems()
        };

        // Update tab count
        const bookmarkTab = document.querySelector('.rec-track-tab[data-track="bookmarked"]');
        if (bookmarkTab) {
            const countEl = bookmarkTab.querySelector('.tab-count');
            if (countEl) countEl.textContent = this.tracks.bookmarked.problems.length;
        }
    },

    /**
     * Render topic mastery matrix
     */
    renderMasteryMatrix() {
        const container = document.getElementById('mastery-matrix-content');
        if (!container || !App.userAnalysis) return;

        const tagStats = App.userAnalysis.tagStats;
        if (!tagStats || tagStats.length === 0) {
            container.innerHTML = '<p class="no-data">Not enough data for mastery analysis</p>';
            return;
        }

        // Calculate mastery score per tag (0-100)
        const maxSolved = Math.max(...tagStats.map(t => t.solved), 1);

        const topTags = tagStats.slice(0, 12);
        let html = '';

        for (const tag of topTags) {
            // Score: weighted combination of solve count, success rate, and max rating
            const countScore = (tag.solved / maxSolved) * 40;
            const successScore = (tag.successRate / 100) * 30;
            const ratingScore = tag.maxRatingSolved ? Math.min(30, (tag.maxRatingSolved / 3000) * 30) : 0;
            const masteryScore = Math.round(countScore + successScore + ratingScore);

            let level = 'beginner';
            if (masteryScore >= 80) level = 'master';
            else if (masteryScore >= 60) level = 'expert';
            else if (masteryScore >= 45) level = 'proficient';
            else if (masteryScore >= 30) level = 'competent';
            else if (masteryScore >= 15) level = 'developing';

            html += `
                <div class="mastery-row">
                    <span class="mastery-tag-name">${tag.tag}</span>
                    <div class="mastery-bar-track">
                        <div class="mastery-bar-fill ${level}" style="width: ${masteryScore}%">
                            ${masteryScore >= 15 ? `<span class="mastery-bar-value">${tag.solved}</span>` : ''}
                        </div>
                    </div>
                    <span class="mastery-score">${masteryScore}%</span>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    /**
     * Wire spoiler toggle and refresh button
     */
    wireControls() {
        const spoilerBtn = document.getElementById('spoiler-toggle-btn');
        if (spoilerBtn) {
            spoilerBtn.addEventListener('click', () => {
                this.spoilerMode = !this.spoilerMode;
                spoilerBtn.classList.toggle('active', this.spoilerMode);
                document.body.classList.toggle('spoiler-active', this.spoilerMode);
            });
        }

        const refreshBtn = document.getElementById('refresh-recommendations-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Loading...';
                this.tracks = {};
                await this.generateTracks();
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh';
            });
        }
    },

    /**
     * Show empty state
     */
    showEmptyState() {
        const container = document.querySelector('#page-recommendations .recommendations-container');
        if (!container) return;

        const pracSection = document.getElementById('practice-guide-section');
        const tracksSection = document.getElementById('rec-tracks-section');
        const masterySection = document.getElementById('mastery-matrix-section');
        const weakSection = document.getElementById('weak-tags-section');

        if (pracSection) pracSection.classList.add('hidden');
        if (tracksSection) tracksSection.classList.add('hidden');
        if (masterySection) masterySection.classList.add('hidden');
        if (weakSection) weakSection.classList.add('hidden');

        let emptyState = document.getElementById('recommendations-empty-state');
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.id = 'recommendations-empty-state';
            emptyState.className = 'profile-empty-state';
            emptyState.style.gridColumn = '1 / -1';
            emptyState.innerHTML = `
                <div class="empty-icon"><i class="fa-solid fa-lightbulb"></i></div>
                <h2>No Data Available</h2>
                <p>Enter your Codeforces handle on the Home page to get personalized recommendations.</p>
                <button onclick="Router.navigateTo('home')" class="btn-primary" style="margin-top: 15px;">Go to Home</button>
            `;
            container.appendChild(emptyState);
        } else {
            emptyState.style.display = 'block';
        }
    },

    /**
     * Hide empty state
     */
    hideEmptyState() {
        const emptyState = document.getElementById('recommendations-empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
};

// Export to global scope
window.RecommendationsPage = RecommendationsPage;
