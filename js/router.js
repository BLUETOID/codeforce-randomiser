// Router module - Single Page Application navigation

const Router = {
    currentPage: 'home',
    pages: ['home', 'profile', 'cheatsheet', 'recommendations'],

    /**
     * Initialize the router
     */
    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });

        // Set initial page from URL hash or default to home
        const hash = window.location.hash.slice(1);
        const initialPage = this.pages.includes(hash) ? hash : 'home';
        this.navigateTo(initialPage, false);

        // Wire up nav links
        this.wireNavLinks();
    },

    /**
     * Wire up navigation link clicks
     */
    wireNavLinks() {
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-nav');
                this.navigateTo(page);
            });
        });
    },

    /**
     * Navigate to a specific page
     */
    navigateTo(page, pushState = true) {
        if (!this.pages.includes(page)) {
            page = 'home';
        }

        // Update current page
        this.currentPage = page;

        // Update URL hash
        if (pushState) {
            window.history.pushState({ page }, '', `#${page}`);
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-nav') === page);
        });

        // Trigger page-specific initialization
        this.onPageEnter(page);
    },

    /**
     * Called when entering a page
     */
    onPageEnter(page) {
        switch (page) {
            case 'profile':
                if (typeof ProfilePage !== 'undefined') {
                    ProfilePage.init();
                }
                break;
            case 'cheatsheet':
                if (typeof CheatsheetPage !== 'undefined') {
                    CheatsheetPage.init();
                }
                break;
            case 'recommendations':
                if (typeof RecommendationsPage !== 'undefined') {
                    RecommendationsPage.init();
                }
                break;
            case 'home':
                // Home page initialization is handled by App.init()
                break;
        }
    },

    /**
     * Get current page
     */
    getCurrentPage() {
        return this.currentPage;
    }
};
