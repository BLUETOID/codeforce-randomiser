// Main application module - Event wiring and orchestration

const App = {
    // State
    solvedIds: new Set(),
    validatedHandle: null,
    isLoading: false,
    seenProblems: new Set(),
    userAnalysis: null, // Store user analysis for recommendations
    profileData: null,  // Store profile statistics
    showAllTags: false, // Toggle for showing all tags in breakdown

    // DOM elements (cached on init)
    elements: {},

    /**
     * Initialize theme from localStorage
     */
    initTheme() {
        const savedTheme = localStorage.getItem('cf_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Wire up theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('cf_theme', isDark ? 'dark' : 'light');
    },

    /**
     * Initialize the application
     */
    async init() {
        this.cacheElements();
        this.renderRatingDropdowns();
        this.renderContestFilter();
        this.renderTags();
        this.loadHistory();
        this.loadSavedProfile();
        this.wireEvents();
        this.initAccordions();
        this.initProfileCollapse();
        this.initBreakdownToggles();

        // Initial count update
        await this.updateMatchingCount();
    },

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            // Filter elements
            minRating: document.getElementById('min-rating'),
            maxRating: document.getElementById('max-rating'),
            contestFilter: document.getElementById('contest-filter'),
            tagsContainer: document.getElementById('tags-container'),
            selectAllTags: document.getElementById('select-all-tags'),
            clearTags: document.getElementById('clear-tags'),
            skipSeen: document.getElementById('skip-seen'),
            historyCount: document.getElementById('history-count'),
            clearHistory: document.getElementById('clear-history'),

            // Handle input elements
            cfHandle: document.getElementById('cf-handle'),
            validateHandle: document.getElementById('validate-handle'),
            handleStatus: document.getElementById('handle-status'),

            // Profile section elements
            profileStats: document.getElementById('profile-stats'),
            profileAvatar: document.getElementById('profile-avatar'),
            profileHandle: document.getElementById('profile-handle'),
            profileRank: document.getElementById('profile-rank'),
            profileRating: document.getElementById('profile-rating'),
            profileMaxRating: document.getElementById('profile-max-rating'),
            profileSolved: document.getElementById('profile-solved'),
            profileContests: document.getElementById('profile-contests'),
            clearProfile: document.getElementById('clear-profile'),
            toggleProfileDetails: document.getElementById('toggle-profile-details'),
            profileDetails: document.getElementById('profile-details'),

            // Rating trend elements
            ratingTrendSection: document.getElementById('rating-trend-section'),
            trendIcon: document.getElementById('trend-icon'),
            trendText: document.getElementById('trend-text'),
            trendDetails: document.getElementById('trend-details'),

            // Breakdown elements
            ratingBreakdownSection: document.getElementById('rating-breakdown-section'),
            ratingBreakdown: document.getElementById('rating-breakdown'),
            tagsBreakdownSection: document.getElementById('tags-breakdown-section'),
            tagsBreakdown: document.getElementById('tags-breakdown'),
            showMoreTags: document.getElementById('show-more-tags'),

            // Action elements
            problemCount: document.getElementById('problem-count'),
            randomizeBtn: document.getElementById('randomize-btn'),
            errorContainer: document.getElementById('error-container'),
            loading: document.getElementById('loading'),

            // Result elements
            resultSection: document.getElementById('result-section'),
            problemId: document.getElementById('problem-id'),
            problemRating: document.getElementById('problem-rating'),
            problemName: document.getElementById('problem-name'),
            problemStats: document.getElementById('problem-stats'),
            problemTags: document.getElementById('problem-tags'),
            problemLink: document.getElementById('problem-link'),
            tryAnother: document.getElementById('try-another'),

            // Practice Guide elements
            practiceGuideSection: document.getElementById('practice-guide-section'),
            practiceGuideContent: document.getElementById('practice-guide-content'),
            recommendedProblemsSection: document.getElementById('recommended-problems-section'),
            recommendedProblemsContent: document.getElementById('recommended-problems-content'),

            // Accordion badges
            profileBadge: document.getElementById('profile-badge'),
            contestBadge: document.getElementById('contest-badge'),
            tagsBadge: document.getElementById('tags-badge'),
            historyBadge: document.getElementById('history-badge')
        };
    },

    /**
     * Initialize accordion functionality
     */
    initAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');

        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.accordion-section');
                const isOpen = section.classList.contains('open');

                // Toggle the clicked accordion
                section.classList.toggle('open', !isOpen);
            });
        });

        // Open the profile input accordion by default if no profile is loaded
        const profileInput = document.querySelector('[data-accordion="profile-input"]');
        if (profileInput) {
            const section = profileInput.closest('.accordion-section');
            if (section) {
                section.classList.add('open');
            }
        }
    },

    /**
     * Initialize profile collapse functionality
     */
    initProfileCollapse() {
        if (this.elements.toggleProfileDetails) {
            this.elements.toggleProfileDetails.addEventListener('click', () => {
                if (this.elements.profileStats) {
                    this.elements.profileStats.classList.toggle('collapsed');
                }
            });
        }
    },

    /**
     * Initialize breakdown toggle functionality
     */
    initBreakdownToggles() {
        const breakdownToggles = document.querySelectorAll('.breakdown-toggle');

        breakdownToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const section = toggle.closest('.collapsible-breakdown');
                section.classList.toggle('open');
            });
        });

        // Open rating breakdown by default
        const ratingBreakdown = document.getElementById('rating-breakdown-section');
        if (ratingBreakdown) {
            ratingBreakdown.classList.add('open');
        }
    },

    /**
     * Update accordion badges
     */
    updateBadges() {
        // Update contest badge
        if (this.elements.contestBadge && this.elements.contestFilter) {
            const selectedOption = this.elements.contestFilter.options[this.elements.contestFilter.selectedIndex];
            this.elements.contestBadge.textContent = selectedOption ? selectedOption.text : 'All';
        }

        // Update tags badge
        if (this.elements.tagsBadge) {
            const selectedCount = this.getSelectedTags().length;
            this.elements.tagsBadge.textContent = selectedCount > 0 ? `${selectedCount} selected` : '0 selected';
            this.elements.tagsBadge.classList.toggle('active', selectedCount > 0);
        }

        // Update history badge
        if (this.elements.historyBadge) {
            this.elements.historyBadge.textContent = this.seenProblems.size.toString();
        }

        // Update profile badge
        if (this.elements.profileBadge) {
            if (this.validatedHandle) {
                this.elements.profileBadge.textContent = this.validatedHandle;
                this.elements.profileBadge.classList.add('active');
            } else {
                this.elements.profileBadge.textContent = '';
                this.elements.profileBadge.classList.remove('active');
            }
        }
    },

    /**
     * Render rating dropdown options
     */
    renderRatingDropdowns() {
        const minSelect = this.elements.minRating;
        const maxSelect = this.elements.maxRating;

        for (let r = RATING_MIN; r <= RATING_MAX; r += RATING_STEP) {
            const optMin = document.createElement('option');
            optMin.value = r;
            optMin.textContent = r;
            minSelect.appendChild(optMin);

            const optMax = document.createElement('option');
            optMax.value = r;
            optMax.textContent = r;
            maxSelect.appendChild(optMax);
        }

        // Set defaults
        minSelect.value = 800;
        maxSelect.value = 1400;
    },

    /**
     * Render contest filter dropdown
     */
    renderContestFilter() {
        const select = this.elements.contestFilter;
        if (!select) return;

        select.innerHTML = '';
        CONTEST_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            select.appendChild(option);
        });
    },

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('cf_history');
            if (saved) {
                this.seenProblems = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load history:', e);
            this.seenProblems = new Set();
        }
        this.updateHistoryDisplay();
    },

    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem('cf_history', JSON.stringify([...this.seenProblems]));
            this.updateHistoryDisplay();
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    },

    /**
     * Update history count display
     */
    updateHistoryDisplay() {
        if (this.elements.historyCount) {
            this.elements.historyCount.textContent = this.seenProblems.size;
        }
        this.updateBadges();
    },

    /**
     * Clear problem history
     */
    clearHistoryClick() {
        if (confirm('Clear your problem history? This cannot be undone.')) {
            this.seenProblems.clear();
            this.saveHistory();
            this.updateMatchingCount();
        }
    },

    /**
     * Load saved profile from localStorage
     */
    loadSavedProfile() {
        try {
            const savedHandle = localStorage.getItem('cf_profile_handle');
            if (savedHandle) {
                this.elements.cfHandle.value = savedHandle;
                // Auto-load profile on startup
                this.validateHandleClick();
            }
        } catch (e) {
            console.error('Failed to load saved profile:', e);
        }
    },

    /**
     * Save profile handle to localStorage
     */
    saveProfileHandle(handle) {
        try {
            if (handle) {
                localStorage.setItem('cf_profile_handle', handle);
            } else {
                localStorage.removeItem('cf_profile_handle');
            }
        } catch (e) {
            console.error('Failed to save profile handle:', e);
        }
    },

    /**
     * Render tag checkboxes
     */
    renderTags() {
        const container = this.elements.tagsContainer;
        container.innerHTML = '';

        CF_TAGS.forEach(tag => {
            const label = document.createElement('label');
            label.className = 'tag-checkbox';
            label.innerHTML = `
                <input type="checkbox" value="${tag}">
                <span>${tag}</span>
            `;
            container.appendChild(label);
        });
    },

    /**
     * Wire up event listeners
     */
    wireEvents() {
        // Rating changes
        this.elements.minRating.addEventListener('change', () => this.updateMatchingCount());
        this.elements.maxRating.addEventListener('change', () => this.updateMatchingCount());

        // Tag controls
        this.elements.selectAllTags.addEventListener('click', () => {
            this.setAllTags(true);
            this.updateMatchingCount();
        });

        this.elements.clearTags.addEventListener('click', () => {
            this.setAllTags(false);
            this.updateMatchingCount();
        });

        // Tag mode
        document.querySelectorAll('input[name="tag-mode"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateMatchingCount());
        });

        // Individual tag changes
        this.elements.tagsContainer.addEventListener('change', () => this.updateMatchingCount());

        // Contest filter
        if (this.elements.contestFilter) {
            this.elements.contestFilter.addEventListener('change', () => {
                this.updateMatchingCount();
                this.updateBadges();
            });
        }

        // History controls
        if (this.elements.skipSeen) {
            this.elements.skipSeen.addEventListener('change', () => this.updateMatchingCount());
        }
        if (this.elements.clearHistory) {
            this.elements.clearHistory.addEventListener('click', () => this.clearHistoryClick());
        }

        // Handle validation
        this.elements.validateHandle.addEventListener('click', () => this.validateHandleClick());
        this.elements.cfHandle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateHandleClick();
        });

        // Clear handle status when input changes
        this.elements.cfHandle.addEventListener('input', () => {
            if (this.validatedHandle !== this.elements.cfHandle.value.trim()) {
                this.elements.handleStatus.textContent = '';
                this.elements.handleStatus.className = 'handle-status';
            }
        });

        // Profile controls
        if (this.elements.clearProfile) {
            this.elements.clearProfile.addEventListener('click', () => this.clearProfile());
        }

        // Show more tags button
        if (this.elements.showMoreTags) {
            this.elements.showMoreTags.addEventListener('click', () => this.toggleShowAllTags());
        }

        // Randomize button
        this.elements.randomizeBtn.addEventListener('click', () => this.randomize());

        // Try another button
        this.elements.tryAnother.addEventListener('click', () => this.randomize());
    },

    /**
     * Set all tags checked/unchecked
     */
    setAllTags(checked) {
        const checkboxes = this.elements.tagsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = checked);
        this.updateBadges();
    },

    /**
     * Get selected tags
     */
    getSelectedTags() {
        const checkboxes = this.elements.tagsContainer.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

    /**
     * Get current tag match mode
     */
    getTagMode() {
        const selected = document.querySelector('input[name="tag-mode"]:checked');
        return selected ? selected.value : 'any';
    },

    /**
     * Validate handle and load full profile
     */
    async validateHandleClick() {
        const handle = this.elements.cfHandle.value.trim();
        if (!handle) {
            this.showHandleStatus('Please enter a handle', false);
            return;
        }

        this.elements.validateHandle.disabled = true;
        this.elements.validateHandle.textContent = 'Loading...';

        try {
            // Fetch comprehensive profile data
            const profileStats = await Api.getFullProfileStats(handle);

            this.validatedHandle = handle;
            this.profileData = profileStats;

            // Extract solved IDs for filtering
            const submissions = await Api.fetchUserSubmissions(handle);
            this.solvedIds = Filters.extractSolvedIds(submissions);

            // Display the profile
            this.displayProfile(profileStats);

            // Save the handle for future sessions
            this.saveProfileHandle(handle);

            this.showHandleStatus(`Profile loaded successfully`, true);
            this.updateMatchingCount();
            this.updateBadges();

            // Close the profile input accordion
            const profileInputSection = document.querySelector('[data-accordion="profile-input"]');
            if (profileInputSection) {
                profileInputSection.closest('.accordion-section').classList.remove('open');
            }

            // Load personalized recommendations
            await this.loadRecommendations(handle);

        } catch (e) {
            this.validatedHandle = null;
            this.profileData = null;
            this.solvedIds = new Set();
            this.hideProfile();
            this.hideRecommendations();
            this.showHandleStatus(e.message || 'Failed to load profile', false);
        }

        this.elements.validateHandle.disabled = false;
        this.elements.validateHandle.textContent = 'Load Profile';
        this.updateBadges();
    },

    /**
     * Display the full profile section
     */
    displayProfile(stats) {
        const { userInfo, solvedCount, ratingTrend, solvedByRating, solvedByTags, contestCount } = stats;

        // Show profile section
        if (this.elements.profileStats) {
            this.elements.profileStats.classList.remove('hidden');
            const hsc = document.getElementById('home-side-column');
            if (hsc) hsc.style.display = 'block';
            // Expand profile details when first loaded
            this.elements.profileStats.classList.remove('collapsed');
        }

        // Set avatar
        if (this.elements.profileAvatar && userInfo.titlePhoto) {
            this.elements.profileAvatar.src = userInfo.titlePhoto;
            this.elements.profileAvatar.alt = userInfo.handle;
            this.elements.profileAvatar.style.display = 'block';
        }

        // Set handle
        if (this.elements.profileHandle) {
            this.elements.profileHandle.textContent = userInfo.handle;
            this.elements.profileHandle.style.color = getRankColor(userInfo.rank || 'newbie');
        }

        // Set rank with color
        if (this.elements.profileRank) {
            const rank = userInfo.rank || 'unrated';
            this.elements.profileRank.textContent = rank;
            this.elements.profileRank.style.backgroundColor = getRankColor(rank);
            this.elements.profileRank.style.color = 'white';
        }

        // Set main stats
        if (this.elements.profileRating) {
            this.elements.profileRating.textContent = userInfo.rating || '--';
            this.elements.profileRating.style.color = getRankColor(userInfo.rank || 'newbie');
        }

        if (this.elements.profileMaxRating) {
            this.elements.profileMaxRating.textContent = userInfo.maxRating || '--';
            this.elements.profileMaxRating.style.color = getRankColor(userInfo.maxRank || 'newbie');
        }

        if (this.elements.profileSolved) {
            this.elements.profileSolved.textContent = solvedCount.toLocaleString();
        }

        if (this.elements.profileContests) {
            this.elements.profileContests.textContent = contestCount;
        }

        // Display rating trend
        this.displayRatingTrend(ratingTrend);

        // Display solved by rating breakdown
        this.displayRatingBreakdown(solvedByRating);

        // Display solved by tags breakdown
        this.displayTagsBreakdown(solvedByTags);
    },

    /**
     * Display rating trend indicator
     */
    displayRatingTrend(trend) {
        if (!this.elements.ratingTrendSection) return;

        const { trend: direction, recentChange, avgChange, contestCount } = trend;

        // Set trend icon using Unicode arrows
        if (this.elements.trendIcon) {
            const icons = {
                increasing: '\u2191', // Up arrow
                decreasing: '\u2193', // Down arrow
                stable: '\u2194'      // Left-right arrow
            };
            this.elements.trendIcon.textContent = icons[direction] || icons.stable;
        }

        // Set trend text
        if (this.elements.trendText) {
            const labels = {
                increasing: 'Increasing',
                decreasing: 'Decreasing',
                stable: 'Stable'
            };
            this.elements.trendText.textContent = labels[direction] || 'Stable';
            this.elements.trendText.className = `trend-text ${direction}`;
        }

        // Set trend details
        if (this.elements.trendDetails) {
            const changeSign = recentChange >= 0 ? '+' : '';
            const avgSign = avgChange >= 0 ? '+' : '';
            this.elements.trendDetails.innerHTML = `
                <span>Last contest: <strong>${changeSign}${recentChange}</strong></span>
                <span>Avg (last 5): <strong>${avgSign}${avgChange}</strong></span>
                <span>Total contests: <strong>${contestCount}</strong></span>
            `;
        }
    },

    /**
     * Display solved problems by rating breakdown
     */
    displayRatingBreakdown(breakdown) {
        if (!this.elements.ratingBreakdown) return;

        const maxCount = Math.max(...breakdown.map(r => r.count), 1);

        this.elements.ratingBreakdown.innerHTML = breakdown.map(range => {
            const widthPercent = (range.count / maxCount) * 100;
            // Extract the first number from label for CSS class
            const ratingClass = 'r-' + range.label.split('-')[0].replace('+', '');

            return `
                <div class="rating-bar-item">
                    <span class="rating-bar-label">${range.label}</span>
                    <div class="rating-bar-container">
                        <div class="rating-bar ${ratingClass}" style="width: ${widthPercent}%">
                            ${range.count > 0 ? `<span class="rating-bar-inner-count">${range.count}</span>` : ''}
                        </div>
                    </div>
                    <span class="rating-bar-count">${range.percentage}%</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Display solved problems by tags breakdown
     */
    displayTagsBreakdown(tags) {
        if (!this.elements.tagsBreakdown) return;

        // Show top 10 tags initially, or all if showAllTags is true
        const displayTags = this.showAllTags ? tags : tags.slice(0, 10);

        this.elements.tagsBreakdown.innerHTML = displayTags.map(tag => `
            <div class="tag-stat-item">
                <span class="tag-stat-name">${tag.tag}</span>
                <span class="tag-stat-count">(${tag.count})</span>
                <span class="tag-stat-percent">${tag.percentage}%</span>
            </div>
        `).join('');

        // Update show more button text
        if (this.elements.showMoreTags) {
            if (tags.length <= 10) {
                this.elements.showMoreTags.style.display = 'none';
            } else {
                this.elements.showMoreTags.style.display = 'inline';
                this.elements.showMoreTags.textContent = this.showAllTags
                    ? 'Show less'
                    : `Show all ${tags.length} tags`;
            }
        }
    },

    /**
     * Toggle showing all tags in breakdown
     */
    toggleShowAllTags() {
        this.showAllTags = !this.showAllTags;
        if (this.profileData && this.profileData.solvedByTags) {
            this.displayTagsBreakdown(this.profileData.solvedByTags);
        }
    },

    /**
     * Hide the profile section
     */
    hideProfile() {
        if (this.elements.profileStats) {
            this.elements.profileStats.classList.add('hidden');
            const hsc = document.getElementById('home-side-column');
            if (hsc) hsc.style.display = 'none';
        }
    },

    /**
     * Clear the current profile
     */
    clearProfile() {
        this.validatedHandle = null;
        this.profileData = null;
        this.solvedIds = new Set();
        this.showAllTags = false;

        // Clear input
        this.elements.cfHandle.value = '';
        this.elements.handleStatus.textContent = '';
        this.elements.handleStatus.className = 'handle-status';

        // Hide profile section
        this.hideProfile();
        this.hideRecommendations();

        // Remove saved handle
        this.saveProfileHandle(null);

        // Update matching count
        this.updateMatchingCount();
        this.updateBadges();

        // Open the profile input accordion
        const profileInputSection = document.querySelector('[data-accordion="profile-input"]');
        if (profileInputSection) {
            profileInputSection.closest('.accordion-section').classList.add('open');
        }
    },

    /**
     * Show handle validation status
     */
    showHandleStatus(message, success) {
        this.elements.handleStatus.textContent = message;
        this.elements.handleStatus.className = `handle-status ${success ? 'success' : 'error'}`;
    },

    /**
     * Update matching problem count
     */
    async updateMatchingCount() {
        try {
            const count = await Filters.countMatching({
                minRating: parseInt(this.elements.minRating.value),
                maxRating: parseInt(this.elements.maxRating.value),
                tags: this.getSelectedTags(),
                tagMode: this.getTagMode(),
                contestType: this.elements.contestFilter ? this.elements.contestFilter.value : 'all',
                skipSeen: this.elements.skipSeen ? this.elements.skipSeen.checked : false,
                solvedIds: this.solvedIds,
                seenIds: this.seenProblems
            });
            this.elements.problemCount.textContent = count.toLocaleString();
        } catch (e) {
            this.elements.problemCount.textContent = '--';
        }
        this.updateBadges();
    },

    /**
     * Show loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.elements.loading.classList.toggle('hidden', !loading);
        this.elements.randomizeBtn.disabled = loading;
    },

    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorContainer.textContent = message;
        this.elements.errorContainer.classList.remove('hidden');
    },

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorContainer.classList.add('hidden');
    },

    /**
     * Display a problem result
     */
    showProblem(problem) {
        this.elements.problemId.textContent = `${problem.contestId}${problem.index}`;
        this.elements.problemRating.textContent = `Rating: ${problem.rating}`;
        this.elements.problemName.textContent = problem.name;

        // Render statistics
        if (this.elements.problemStats) {
            const solvedText = problem.solvedCount
                ? `Solved by ${problem.solvedCount.toLocaleString()}`
                : '';
            const contestText = `Contest ${problem.contestId}`;
            this.elements.problemStats.innerHTML = `
                <span>${contestText}</span>
                ${solvedText ? `<span>${solvedText}</span>` : ''}
            `;
        }

        // Render tags
        this.elements.problemTags.innerHTML = '';
        (problem.tags || []).forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag;
            this.elements.problemTags.appendChild(span);
        });

        this.elements.problemLink.href = problem.url;
        this.elements.resultSection.classList.remove('hidden');

        // Scroll to result
        this.elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Add to history
        const problemId = `${problem.contestId}-${problem.index}`;
        this.seenProblems.add(problemId);
        this.saveHistory();
    },

    /**
     * Main randomize function
     */
    async randomize() {
        if (this.isLoading) return;

        this.hideError();
        this.setLoading(true);
        this.elements.resultSection.classList.add('hidden');

        try {
            // Validate rating range
            const minRating = parseInt(this.elements.minRating.value);
            const maxRating = parseInt(this.elements.maxRating.value);

            if (minRating > maxRating) {
                throw new Error('Min rating cannot be greater than max rating');
            }

            // Get handle if validated
            const handle = this.validatedHandle || null;

            const result = await Filters.getRandomProblem({
                minRating,
                maxRating,
                tags: this.getSelectedTags(),
                tagMode: this.getTagMode(),
                contestType: this.elements.contestFilter ? this.elements.contestFilter.value : 'all',
                excludeHandle: handle,
                skipSeen: this.elements.skipSeen ? this.elements.skipSeen.checked : false,
                seenIds: this.seenProblems
            });

            if (result.success) {
                this.showProblem(result.problem);
                this.elements.problemCount.textContent = result.matchingCount.toLocaleString();
            } else {
                this.showError(result.error);
            }
        } catch (e) {
            this.showError(e.message || 'An error occurred. Please try again.');
        }

        this.setLoading(false);
    },

    /**
     * Load personalized recommendations for a user
     */
    async loadRecommendations(handle) {
        try {
            // Analyze user
            this.userAnalysis = await Recommendations.analyzeUser(handle);

            // Display practice guide
            if (this.elements.practiceGuideSection && this.elements.practiceGuideContent) {
                const guideHTML = Recommendations.generatePracticeGuideHTML(this.userAnalysis);
                this.elements.practiceGuideContent.innerHTML = guideHTML;
                this.elements.practiceGuideSection.classList.remove('hidden');

                // Wire up the "Apply Recommended Settings" button
                const applyBtn = document.getElementById('apply-recommended-settings');
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        this.applyRecommendedSettings();
                        Router.navigateTo('home');
                    });
                }
            }

            // Get and display recommended problems
            const recommendedProblems = await Recommendations.getRecommendedProblems(this.userAnalysis, 6);
            if (this.elements.recommendedProblemsSection && this.elements.recommendedProblemsContent) {
                const problemsHTML = Recommendations.generateRecommendedProblemsHTML(recommendedProblems);
                this.elements.recommendedProblemsContent.innerHTML = problemsHTML;
                this.elements.recommendedProblemsSection.classList.remove('hidden');
            }

            if (typeof RecommendationsPage !== 'undefined') {
                RecommendationsPage.hideEmptyState();
            }
        } catch (e) {
            console.error('Failed to load recommendations:', e);
            // Don't show error to user - recommendations are optional enhancement
        }
    },

    /**
     * Hide recommendations sections
     */
    hideRecommendations() {
        this.userAnalysis = null;

        if (this.elements.practiceGuideSection) {
            this.elements.practiceGuideSection.classList.add('hidden');
        }
        if (this.elements.recommendedProblemsSection) {
            this.elements.recommendedProblemsSection.classList.add('hidden');
        }

        if (typeof RecommendationsPage !== 'undefined') {
            RecommendationsPage.showEmptyState();
        }
    },

    /**
     * Apply recommended settings to filters
     */
    applyRecommendedSettings() {
        if (!this.userAnalysis) return;

        const { recommendedRange, focusTopics } = this.userAnalysis;

        // Apply recommended rating range
        if (recommendedRange && recommendedRange.target) {
            this.elements.minRating.value = recommendedRange.target.min;
            this.elements.maxRating.value = recommendedRange.target.max;
        }

        // Clear all tags first
        this.setAllTags(false);

        // Select focus topic tags
        if (focusTopics && focusTopics.length > 0) {
            const focusTagNames = focusTopics.map(t => t.tag);
            const checkboxes = this.elements.tagsContainer.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach(cb => {
                if (focusTagNames.includes(cb.value)) {
                    cb.checked = true;
                }
            });
        }

        // Set tag mode to "any" for broader matching
        const anyRadio = document.querySelector('input[name="tag-mode"][value="any"]');
        if (anyRadio) {
            anyRadio.checked = true;
        }

        // Open the tags accordion to show what was selected
        const tagsAccordion = document.querySelector('[data-accordion="tags"]');
        if (tagsAccordion) {
            tagsAccordion.closest('.accordion-section').classList.add('open');
        }

        // Update matching count
        this.updateMatchingCount();

        // Scroll to primary controls
        const primaryControls = document.querySelector('.primary-controls');
        if (primaryControls) {
            primaryControls.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Show feedback
        this.showHandleStatus('Recommended settings applied!', true);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first
    App.initTheme();

    // Initialize the router for page navigation
    Router.init();

    // Initialize main app
    App.init();
});
