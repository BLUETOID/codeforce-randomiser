// Codeforces API endpoints
const CF_API = {
    PROBLEMS: 'https://codeforces.com/api/problemset.problems',
    USER_STATUS: 'https://codeforces.com/api/user.status',
    USER_INFO: 'https://codeforces.com/api/user.info',
    USER_RATING: 'https://codeforces.com/api/user.rating'
};

// Rating ranges for breakdown analysis
const RATING_RANGES = [
    { min: 800, max: 999, label: '800-999' },
    { min: 1000, max: 1199, label: '1000-1199' },
    { min: 1200, max: 1399, label: '1200-1399' },
    { min: 1400, max: 1599, label: '1400-1599' },
    { min: 1600, max: 1899, label: '1600-1899' },
    { min: 1900, max: 2099, label: '1900-2099' },
    { min: 2100, max: 2399, label: '2100-2399' },
    { min: 2400, max: 2699, label: '2400-2699' },
    { min: 2700, max: 3500, label: '2700+' }
];

// All Codeforces problem tags
const CF_TAGS = [
    '2-sat',
    'binary search',
    'bitmasks',
    'brute force',
    'chinese remainder theorem',
    'combinatorics',
    'constructive algorithms',
    'data structures',
    'dfs and similar',
    'divide and conquer',
    'dp',
    'dsu',
    'expression parsing',
    'fft',
    'flows',
    'games',
    'geometry',
    'graph matchings',
    'graphs',
    'greedy',
    'hashing',
    'implementation',
    'interactive',
    'math',
    'matrices',
    'meet-in-the-middle',
    'number theory',
    'probabilities',
    'schedules',
    'shortest paths',
    'sortings',
    'string suffix structures',
    'strings',
    'ternary search',
    'trees',
    'two pointers'
];

// Rating range
const RATING_MIN = 800;
const RATING_MAX = 3500;
const RATING_STEP = 100;

// Cache TTL in milliseconds
const CACHE_TTL = {
    PROBLEMS: 60 * 60 * 1000,      // 1 hour for problems list
    USER: 15 * 60 * 1000,          // 15 minutes for user submissions
    USER_INFO: 30 * 60 * 1000      // 30 minutes for user profile info
};

// Contest types for filtering
const CONTEST_TYPES = [
    { value: 'all', label: 'All Contests' },
    { value: 'div1', label: 'Div. 1' },
    { value: 'div2', label: 'Div. 2' },
    { value: 'div3', label: 'Div. 3' },
    { value: 'div4', label: 'Div. 4' },
    { value: 'educational', label: 'Educational' },
    { value: 'global', label: 'Global Round' },
    { value: 'practice', label: 'Practice/Gym' }
];

// Utility function to determine contest type from contest name
function getContestType(contestId, contestName = '') {
    if (!contestName) return 'practice';

    const lowerName = contestName.toLowerCase();

    if (lowerName.includes('educational')) return 'educational';
    if (lowerName.includes('global')) return 'global';
    if (lowerName.includes('div. 1')) return 'div1';
    if (lowerName.includes('div. 2')) return 'div2';
    if (lowerName.includes('div. 3')) return 'div3';
    if (lowerName.includes('div. 4')) return 'div4';

    return 'practice';
}

// Codeforces rank colors
function getRankColor(rank) {
    const rankColors = {
        'newbie': '#808080',
        'pupil': '#008000',
        'specialist': '#03a89e',
        'expert': '#0000ff',
        'candidate master': '#aa00aa',
        'master': '#ff8c00',
        'international master': '#ff8c00',
        'grandmaster': '#ff0000',
        'international grandmaster': '#ff0000',
        'legendary grandmaster': '#ff0000'
    };

    return rankColors[rank.toLowerCase()] || '#808080';
}
