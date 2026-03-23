// Competitive Programming Cheatsheet Module

const Cheatsheet = {
    isVisible: false,
    searchTerm: '',
    expandedSections: new Set(),

    // Cheatsheet data organized by categories
    data: {
        // ============================================
        // PROBLEM-SOLVING STRATEGIES BY TAG
        // ============================================
        strategies: {
            implementation: {
                title: 'Implementation',
                icon: 'code',
                concepts: [
                    'Simulation problems - follow the problem statement exactly',
                    'Edge case handling - empty inputs, single elements, max/min values',
                    'Modular code design - break into functions for readability',
                    'Use meaningful variable names for complex logic'
                ],
                patterns: [
                    'Grid/matrix traversal with direction arrays',
                    'State machine for multi-step processes',
                    'Parse and simulate approach',
                    'Brute force with careful bound checking'
                ],
                code: `// Direction arrays for grid traversal
int dx[] = {0, 0, 1, -1};      // 4 directions
int dy[] = {1, -1, 0, 0};
int dx8[] = {0, 0, 1, -1, 1, 1, -1, -1};  // 8 directions
int dy8[] = {1, -1, 0, 0, 1, -1, 1, -1};

// Safe grid access
bool valid(int x, int y, int n, int m) {
    return x >= 0 && x < n && y >= 0 && y < m;
}`,
                complexity: 'Usually O(N) to O(N^2), rarely worse',
                pitfalls: [
                    'Off-by-one errors in loops',
                    'Integer overflow on multiplication',
                    'Not handling empty input',
                    'Forgetting to reset variables between test cases'
                ]
            },

            math: {
                title: 'Math & Number Theory',
                icon: 'calculator',
                concepts: [
                    'Modular arithmetic - (a+b)%m = ((a%m)+(b%m))%m',
                    'GCD/LCM - Euclidean algorithm',
                    'Prime factorization and sieve',
                    'Combinatorics - nCr, nPr calculations',
                    'Modular inverse for division under mod'
                ],
                patterns: [
                    'Sieve of Eratosthenes for primes',
                    'Fast exponentiation for large powers',
                    'Chinese Remainder Theorem',
                    'Euler totient function'
                ],
                code: `// GCD (C++17 has __gcd and gcd)
long long gcd(long long a, long long b) {
    return b ? gcd(b, a % b) : a;
}

// LCM
long long lcm(long long a, long long b) {
    return a / gcd(a, b) * b;  // Divide first to prevent overflow
}

// Fast exponentiation
long long power(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

// Modular inverse (when mod is prime)
long long modInverse(long long a, long long mod) {
    return power(a, mod - 2, mod);
}

// Sieve of Eratosthenes
vector<bool> sieve(int n) {
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i)
                isPrime[j] = false;
        }
    }
    return isPrime;
}`,
                complexity: 'GCD: O(log(min(a,b))), Sieve: O(N log log N), Power: O(log exp)',
                pitfalls: [
                    'Forgetting to take mod after each operation',
                    'Division under modulo needs modular inverse',
                    'Integer overflow in intermediate calculations',
                    'Using int instead of long long'
                ]
            },

            dp: {
                title: 'Dynamic Programming',
                icon: 'layers',
                concepts: [
                    'Optimal substructure - solution built from optimal sub-solutions',
                    'Overlapping subproblems - same subproblems solved multiple times',
                    'State definition - what information defines a subproblem?',
                    'Transition - how to combine smaller solutions?',
                    'Base cases - smallest subproblems with known answers'
                ],
                patterns: [
                    '1D DP: dp[i] depends on dp[j] where j < i',
                    '2D DP: dp[i][j] for ranges or two parameters',
                    'Knapsack variants: 0/1, unbounded, bounded',
                    'LCS/LIS problems',
                    'Bitmask DP for subset states',
                    'Digit DP for counting numbers with properties'
                ],
                code: `// Classic 0/1 Knapsack
int knapsack(vector<int>& weights, vector<int>& values, int W) {
    int n = weights.size();
    vector<int> dp(W + 1, 0);
    for (int i = 0; i < n; i++) {
        for (int w = W; w >= weights[i]; w--) {
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}

// Longest Increasing Subsequence O(N log N)
int LIS(vector<int>& arr) {
    vector<int> dp;
    for (int x : arr) {
        auto it = lower_bound(dp.begin(), dp.end(), x);
        if (it == dp.end()) dp.push_back(x);
        else *it = x;
    }
    return dp.size();
}

// Longest Common Subsequence
int LCS(string& a, string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i-1] == b[j-1])
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[n][m];
}`,
                complexity: 'Depends on state space: O(N), O(N^2), O(N*W), O(2^N * N)',
                pitfalls: [
                    'Wrong state definition',
                    'Missing base cases',
                    'Wrong transition order (top-down vs bottom-up)',
                    'Not considering all transitions',
                    'Memory limit - use space optimization when possible'
                ]
            },

            greedy: {
                title: 'Greedy Algorithms',
                icon: 'zap',
                concepts: [
                    'Local optimal choice leads to global optimal',
                    'Exchange argument - prove swapping worsens solution',
                    'Stays ahead argument - greedy is never behind optimal',
                    'Structural argument - show greedy matches optimal structure'
                ],
                patterns: [
                    'Activity/interval selection - sort by end time',
                    'Fractional knapsack - sort by value/weight ratio',
                    'Huffman coding - always combine smallest',
                    'Minimum spanning tree (Kruskal, Prim)',
                    'Dijkstra shortest path (greedy BFS)'
                ],
                code: `// Activity Selection (maximum non-overlapping intervals)
int activitySelection(vector<pair<int,int>>& intervals) {
    // Sort by end time
    sort(intervals.begin(), intervals.end(),
         [](auto& a, auto& b) { return a.second < b.second; });

    int count = 0, lastEnd = INT_MIN;
    for (auto& [start, end] : intervals) {
        if (start >= lastEnd) {
            count++;
            lastEnd = end;
        }
    }
    return count;
}

// Minimum platforms/meeting rooms needed
int minPlatforms(vector<pair<int,int>>& intervals) {
    vector<int> events;
    for (auto& [start, end] : intervals) {
        events.push_back(start);      // +1 for arrival
        events.push_back(-(end + 1)); // -1 for departure (add 1 to handle same time)
    }
    sort(events.begin(), events.end(), [](int a, int b) {
        return abs(a) < abs(b) || (abs(a) == abs(b) && a < b);
    });

    int current = 0, maxNeeded = 0;
    for (int e : events) {
        current += (e > 0 ? 1 : -1);
        maxNeeded = max(maxNeeded, current);
    }
    return maxNeeded;
}`,
                complexity: 'Usually O(N log N) due to sorting',
                pitfalls: [
                    'Greedy doesnt always work - verify with proof',
                    'Wrong sorting criteria',
                    'Not considering all greedy choices',
                    'Confusing with DP problems'
                ]
            },

            binarySearch: {
                title: 'Binary Search',
                icon: 'search',
                concepts: [
                    'Search space must be monotonic',
                    'Binary search the answer when direct computation is hard',
                    'Lower bound: first element >= target',
                    'Upper bound: first element > target'
                ],
                patterns: [
                    'Classic binary search on sorted array',
                    'Binary search on answer (min/max optimization)',
                    'Ternary search for unimodal functions',
                    'Binary search on floating point'
                ],
                code: `// Binary search templates
// Find first element >= target
int lowerBound(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// Find first element > target
int upperBound(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] <= target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// Binary search on answer template
// "Can we achieve result X?" - minimize maximum or maximize minimum
bool canAchieve(int x) {
    // Problem-specific check
    return true;
}

int binarySearchAnswer(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canAchieve(mid))
            hi = mid;     // Can achieve, try smaller
        else
            lo = mid + 1; // Cannot achieve, need larger
    }
    return lo;
}

// Floating point binary search
double binarySearchDouble(double lo, double hi) {
    for (int i = 0; i < 100; i++) {  // 100 iterations is enough
        double mid = (lo + hi) / 2;
        if (check(mid)) hi = mid;
        else lo = mid;
    }
    return lo;
}`,
                complexity: 'O(log N) for search, O(N log X) for binary search on answer',
                pitfalls: [
                    'Integer overflow: use lo + (hi - lo) / 2',
                    'Infinite loop: ensure lo < hi changes each iteration',
                    'Off-by-one in bounds',
                    'Wrong predicate direction'
                ]
            },

            graphs: {
                title: 'Graphs',
                icon: 'git-branch',
                concepts: [
                    'Representation: adjacency list vs matrix',
                    'BFS: shortest path in unweighted graphs, level-order',
                    'DFS: connectivity, cycle detection, topological sort',
                    'Shortest paths: Dijkstra, Bellman-Ford, Floyd-Warshall',
                    'MST: Kruskal, Prim'
                ],
                patterns: [
                    'BFS for shortest path in unweighted graph',
                    'DFS for connected components',
                    'Topological sort for DAGs',
                    '0-1 BFS for 0/1 weighted edges',
                    'Union-Find for connectivity queries'
                ],
                code: `// BFS shortest path
vector<int> bfs(vector<vector<int>>& adj, int start) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q;
    q.push(start);
    dist[start] = 0;

    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}

// DFS with discovery/finish times
int timer = 0;
vector<int> disc, finish;
vector<bool> visited;

void dfs(vector<vector<int>>& adj, int u) {
    visited[u] = true;
    disc[u] = timer++;
    for (int v : adj[u]) {
        if (!visited[v]) dfs(adj, v);
    }
    finish[u] = timer++;
}

// Dijkstra's algorithm
vector<long long> dijkstra(vector<vector<pair<int,int>>>& adj, int start) {
    int n = adj.size();
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>,
                   greater<pair<long long,int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;

        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

// Union-Find with path compression and union by rank
class DSU {
    vector<int> parent, rank;
public:
    DSU(int n) : parent(n), rank(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank[x] < rank[y]) swap(x, y);
        parent[y] = x;
        if (rank[x] == rank[y]) rank[x]++;
        return true;
    }
};`,
                complexity: 'BFS/DFS: O(V+E), Dijkstra: O((V+E)log V), DSU: O(alpha(N)) per op',
                pitfalls: [
                    'Not handling disconnected components',
                    'Forgetting to mark visited in BFS/DFS',
                    'Using Dijkstra with negative weights',
                    '1-indexed vs 0-indexed nodes'
                ]
            },

            dataStructures: {
                title: 'Data Structures',
                icon: 'database',
                concepts: [
                    'Choose based on required operations',
                    'Trade-offs: time vs space, insertion vs query',
                    'STL containers: set, map, priority_queue, deque',
                    'Custom structures: segment tree, BIT, sparse table'
                ],
                patterns: [
                    'set/map: O(log N) insert, delete, find',
                    'unordered_set/map: O(1) average operations',
                    'priority_queue: O(log N) push/pop, O(1) top',
                    'Segment tree: O(log N) range queries and updates',
                    'BIT/Fenwick: O(log N) prefix sum and point update'
                ],
                code: `// When to use what:
// set/map       - ordered keys, log N operations
// unordered_*   - no order needed, O(1) average
// multiset      - duplicates allowed
// priority_queue - always need max/min element
// deque         - push/pop from both ends

// Fenwick Tree (BIT) - prefix sums with updates
class BIT {
    vector<long long> tree;
    int n;
public:
    BIT(int n) : n(n), tree(n + 1, 0) {}

    void update(int i, long long delta) {
        for (++i; i <= n; i += i & (-i))
            tree[i] += delta;
    }

    long long query(int i) {
        long long sum = 0;
        for (++i; i > 0; i -= i & (-i))
            sum += tree[i];
        return sum;
    }

    long long rangeQuery(int l, int r) {
        return query(r) - (l > 0 ? query(l - 1) : 0);
    }
};

// Segment Tree - range min query with point updates
class SegTree {
    vector<int> tree;
    int n;

    void build(vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2*node, start, mid);
            build(arr, 2*node+1, mid+1, end);
            tree[node] = min(tree[2*node], tree[2*node+1]);
        }
    }

public:
    SegTree(vector<int>& arr) : n(arr.size()), tree(4 * n) {
        build(arr, 1, 0, n-1);
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return INT_MAX;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return min(query(2*node, start, mid, l, r),
                   query(2*node+1, mid+1, end, l, r));
    }

    int query(int l, int r) { return query(1, 0, n-1, l, r); }
};`,
                complexity: 'Depends on structure - see individual complexities above',
                pitfalls: [
                    'Using wrong container for the problem',
                    'Not clearing containers between test cases',
                    'Hash collisions in unordered containers',
                    'Segment tree size: use 4*N'
                ]
            },

            strings: {
                title: 'Strings',
                icon: 'type',
                concepts: [
                    'String hashing for fast comparison',
                    'Pattern matching: KMP, Z-algorithm, Rabin-Karp',
                    'Trie for prefix queries',
                    'Suffix array for substring problems'
                ],
                patterns: [
                    'Polynomial hashing for string comparison',
                    'KMP for single pattern matching',
                    'Z-function for pattern occurrences',
                    'Trie for dictionary operations'
                ],
                code: `// Polynomial Rolling Hash
struct StringHash {
    const long long MOD = 1e9 + 7;
    const long long BASE = 31;
    vector<long long> hash, pw;

    StringHash(string& s) {
        int n = s.size();
        hash.resize(n + 1); pw.resize(n + 1);
        hash[0] = 0; pw[0] = 1;
        for (int i = 0; i < n; i++) {
            hash[i + 1] = (hash[i] * BASE + s[i] - 'a' + 1) % MOD;
            pw[i + 1] = pw[i] * BASE % MOD;
        }
    }

    // Get hash of substring [l, r]
    long long get(int l, int r) {
        return (hash[r + 1] - hash[l] * pw[r - l + 1] % MOD + MOD) % MOD;
    }
};

// Z-function: z[i] = length of longest string starting from i
// which is also a prefix
vector<int> zFunction(string& s) {
    int n = s.size();
    vector<int> z(n);
    int l = 0, r = 0;
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

// KMP failure function
vector<int> kmpFailure(string& pattern) {
    int m = pattern.size();
    vector<int> fail(m, 0);
    int j = 0;
    for (int i = 1; i < m; i++) {
        while (j > 0 && pattern[i] != pattern[j])
            j = fail[j - 1];
        if (pattern[i] == pattern[j]) j++;
        fail[i] = j;
    }
    return fail;
}`,
                complexity: 'Hashing: O(N) build, O(1) query. KMP/Z: O(N+M)',
                pitfalls: [
                    'Hash collisions - use double hashing for safety',
                    'Choosing bad hash parameters',
                    'Not handling empty strings',
                    'Case sensitivity'
                ]
            },

            twoPointers: {
                title: 'Two Pointers & Sliding Window',
                icon: 'move',
                concepts: [
                    'Two pointers: opposite ends or same direction',
                    'Sliding window: fixed or variable size',
                    'Meet in the middle: split search space',
                    'Works when relationship is monotonic'
                ],
                patterns: [
                    'Two sum in sorted array',
                    'Longest substring without repeating chars',
                    'Minimum window substring',
                    'Subarray with given sum'
                ],
                code: `// Two pointers - pair with target sum in sorted array
pair<int,int> twoSum(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return {left, right};
        else if (sum < target) left++;
        else right--;
    }
    return {-1, -1};
}

// Sliding window - longest substring with at most K distinct chars
int longestKDistinct(string& s, int k) {
    unordered_map<char, int> count;
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.size(); right++) {
        count[s[right]]++;

        while (count.size() > k) {
            count[s[left]]--;
            if (count[s[left]] == 0) count.erase(s[left]);
            left++;
        }

        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}

// Fixed-size sliding window - max sum of k consecutive elements
int maxSumK(vector<int>& arr, int k) {
    int n = arr.size();
    int windowSum = 0, maxSum = INT_MIN;

    for (int i = 0; i < n; i++) {
        windowSum += arr[i];
        if (i >= k - 1) {
            maxSum = max(maxSum, windowSum);
            windowSum -= arr[i - k + 1];
        }
    }
    return maxSum;
}

// Meet in the middle - subset sum (when N is too large for 2^N but 2^(N/2) works)
bool subsetSum(vector<int>& arr, int target) {
    int n = arr.size();
    int half = n / 2;

    set<int> firstHalf;
    for (int mask = 0; mask < (1 << half); mask++) {
        int sum = 0;
        for (int i = 0; i < half; i++)
            if (mask & (1 << i)) sum += arr[i];
        firstHalf.insert(sum);
    }

    for (int mask = 0; mask < (1 << (n - half)); mask++) {
        int sum = 0;
        for (int i = 0; i < n - half; i++)
            if (mask & (1 << i)) sum += arr[half + i];
        if (firstHalf.count(target - sum)) return true;
    }
    return false;
}`,
                complexity: 'Two pointers: O(N), Sliding window: O(N), Meet in middle: O(2^(N/2))',
                pitfalls: [
                    'Not handling edge cases (empty array)',
                    'Wrong window shrink condition',
                    'Forgetting to update answer inside loop',
                    'Off-by-one in window boundaries'
                ]
            }
        },

        // ============================================
        // COMMON FORMULAS & TRICKS
        // ============================================
        formulas: {
            arithmetic: {
                title: 'Arithmetic Formulas',
                items: [
                    { name: 'Sum 1 to N', formula: 'N * (N + 1) / 2' },
                    { name: 'Sum of squares', formula: 'N * (N + 1) * (2N + 1) / 6' },
                    { name: 'Sum of cubes', formula: '(N * (N + 1) / 2)^2' },
                    { name: 'AP sum', formula: 'n/2 * (first + last) = n/2 * (2a + (n-1)d)' },
                    { name: 'GP sum', formula: 'a * (r^n - 1) / (r - 1)' }
                ]
            },
            combinatorics: {
                title: 'Combinatorics',
                items: [
                    { name: 'nCr', formula: 'n! / (r! * (n-r)!)' },
                    { name: 'nPr', formula: 'n! / (n-r)!' },
                    { name: 'Stars and Bars', formula: 'C(n+k-1, k-1) - distribute n items into k bins' },
                    { name: 'Catalan numbers', formula: 'C(2n,n)/(n+1) - balanced parentheses, BST shapes' },
                    { name: 'Derangements', formula: 'D(n) = (n-1) * (D(n-1) + D(n-2))' }
                ],
                code: `// nCr with Pascal's triangle (no overflow for small values)
vector<vector<long long>> pascalTriangle(int n) {
    vector<vector<long long>> C(n + 1, vector<long long>(n + 1, 0));
    for (int i = 0; i <= n; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++)
            C[i][j] = C[i-1][j-1] + C[i-1][j];
    }
    return C;
}

// nCr with modular arithmetic
const long long MOD = 1e9 + 7;
vector<long long> fact, invFact;

void precompute(int n) {
    fact.resize(n + 1);
    invFact.resize(n + 1);
    fact[0] = 1;
    for (int i = 1; i <= n; i++)
        fact[i] = fact[i-1] * i % MOD;
    invFact[n] = power(fact[n], MOD - 2, MOD);
    for (int i = n - 1; i >= 0; i--)
        invFact[i] = invFact[i+1] * (i+1) % MOD;
}

long long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] * invFact[r] % MOD * invFact[n-r] % MOD;
}`
            },
            numberTheory: {
                title: 'Number Theory',
                items: [
                    { name: 'Divisor count', formula: 'If n = p1^a1 * p2^a2 ... then d(n) = (a1+1)*(a2+1)*...' },
                    { name: 'Divisor sum', formula: 'sigma(n) = product of (p^(a+1) - 1)/(p - 1) for each prime p^a' },
                    { name: 'Euler totient', formula: 'phi(n) = n * product of (1 - 1/p) for each prime p dividing n' },
                    { name: 'Fermats little theorem', formula: 'a^(p-1) = 1 (mod p) if gcd(a,p) = 1' },
                    { name: 'Eulers theorem', formula: 'a^phi(n) = 1 (mod n) if gcd(a,n) = 1' }
                ],
                code: `// Euler's totient function
long long phi(long long n) {
    long long result = n;
    for (long long p = 2; p * p <= n; p++) {
        if (n % p == 0) {
            while (n % p == 0) n /= p;
            result -= result / p;
        }
    }
    if (n > 1) result -= result / n;
    return result;
}

// Count divisors
int countDivisors(long long n) {
    int count = 0;
    for (long long i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            count++;
            if (i != n / i) count++;
        }
    }
    return count;
}

// Prime factorization
vector<pair<long long, int>> factorize(long long n) {
    vector<pair<long long, int>> factors;
    for (long long p = 2; p * p <= n; p++) {
        if (n % p == 0) {
            int count = 0;
            while (n % p == 0) { n /= p; count++; }
            factors.push_back({p, count});
        }
    }
    if (n > 1) factors.push_back({n, 1});
    return factors;
}`
            },
            geometry: {
                title: 'Geometry',
                items: [
                    { name: 'Distance', formula: 'sqrt((x2-x1)^2 + (y2-y1)^2)' },
                    { name: 'Triangle area (coords)', formula: '|x1(y2-y3) + x2(y3-y1) + x3(y1-y2)| / 2' },
                    { name: 'Triangle area (Herons)', formula: 'sqrt(s(s-a)(s-b)(s-c)) where s = (a+b+c)/2' },
                    { name: 'Cross product 2D', formula: 'x1*y2 - x2*y1 (signed area of parallelogram)' },
                    { name: 'Dot product', formula: 'x1*x2 + y1*y2 = |a||b|cos(theta)' }
                ],
                code: `// Point structure
struct Point {
    double x, y;
    Point operator-(Point p) { return {x - p.x, y - p.y}; }
    double cross(Point p) { return x * p.y - y * p.x; }
    double dot(Point p) { return x * p.x + y * p.y; }
    double norm() { return sqrt(x*x + y*y); }
};

// Check if point C is left of line AB
// > 0: left, < 0: right, = 0: on line
double cross(Point A, Point B, Point C) {
    return (B - A).cross(C - A);
}

// Convex hull (Andrew's monotone chain)
vector<Point> convexHull(vector<Point> pts) {
    sort(pts.begin(), pts.end(), [](Point a, Point b) {
        return a.x < b.x || (a.x == b.x && a.y < b.y);
    });

    vector<Point> hull;
    // Lower hull
    for (auto& p : pts) {
        while (hull.size() >= 2 && cross(hull[hull.size()-2], hull.back(), p) <= 0)
            hull.pop_back();
        hull.push_back(p);
    }
    // Upper hull
    int lower = hull.size();
    for (int i = pts.size() - 2; i >= 0; i--) {
        while (hull.size() > lower && cross(hull[hull.size()-2], hull.back(), pts[i]) <= 0)
            hull.pop_back();
        hull.push_back(pts[i]);
    }
    hull.pop_back();
    return hull;
}`
            },
            bitManipulation: {
                title: 'Bit Manipulation',
                items: [
                    { name: 'Check if ith bit is set', formula: '(n >> i) & 1 or n & (1 << i)' },
                    { name: 'Set ith bit', formula: 'n | (1 << i)' },
                    { name: 'Clear ith bit', formula: 'n & ~(1 << i)' },
                    { name: 'Toggle ith bit', formula: 'n ^ (1 << i)' },
                    { name: 'Check power of 2', formula: 'n > 0 && (n & (n-1)) == 0' },
                    { name: 'Lowest set bit', formula: 'n & (-n)' },
                    { name: 'Count set bits', formula: '__builtin_popcount(n)' },
                    { name: 'All subsets of mask', formula: 'for (int s = mask; s > 0; s = (s-1) & mask)' }
                ],
                code: `// Iterate all subsets of a bitmask
void iterateSubsets(int mask) {
    for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
        // process subset 'sub'
    }
    // don't forget empty subset if needed
}

// Iterate all masks with exactly k bits set
void iterateKBits(int n, int k) {
    for (int mask = (1 << k) - 1; mask < (1 << n); ) {
        // process mask
        int c = mask & -mask;
        int r = mask + c;
        mask = (((r ^ mask) >> 2) / c) | r;
    }
}

// GCC built-in functions
// __builtin_popcount(x)    - count of 1 bits
// __builtin_ctz(x)         - count trailing zeros
// __builtin_clz(x)         - count leading zeros
// __builtin_parity(x)      - parity (1 if odd number of 1s)`
            }
        },

        // ============================================
        // TIME COMPLEXITY GUIDE
        // ============================================
        complexity: {
            guide: [
                { n: '10', allowed: 'O(N!)', note: 'Permutations, brute force' },
                { n: '20', allowed: 'O(2^N)', note: 'Subset enumeration, meet in middle for 40' },
                { n: '100', allowed: 'O(N^4)', note: 'DP with 4 states' },
                { n: '400', allowed: 'O(N^3)', note: 'Floyd-Warshall, matrix operations' },
                { n: '2000', allowed: 'O(N^2 log N)', note: 'Nested loops with sorting' },
                { n: '10^4', allowed: 'O(N^2)', note: 'Simple nested loops, 2D DP' },
                { n: '10^5', allowed: 'O(N sqrt N)', note: 'Square root decomposition' },
                { n: '10^6', allowed: 'O(N log N)', note: 'Sorting, segment trees, binary search' },
                { n: '10^7', allowed: 'O(N)', note: 'Linear scan, prefix sums' },
                { n: '10^9', allowed: 'O(sqrt N) or O(log N)', note: 'Binary search, math formulas' },
                { n: '10^18', allowed: 'O(log N)', note: 'Binary search, fast exponentiation' }
            ],
            tips: [
                'Rule of thumb: 10^8 simple operations per second',
                'Memory: 256 MB = about 64 million integers',
                'Recursive depth limit: usually around 10^6 (use iterative for deep recursion)',
                'When in doubt, calculate: operations = N * complexity factor'
            ]
        },

        // ============================================
        // CONTEST TIPS
        // ============================================
        contestTips: {
            timeManagement: [
                'Read ALL problems first (5-10 minutes) before solving',
                'Start with easiest problems (usually A, B)',
                'Spend max 30-40 min on a problem before moving on',
                'Return to skipped problems with fresh perspective',
                'Last 10 min: submit any partial solutions, debug existing'
            ],
            whenToSkip: [
                'Spent 30+ min without clear approach',
                'Problem requires algorithm you dont know',
                'Too many edge cases making implementation risky',
                'Higher rated problem while easier ones remain'
            ],
            debugging: [
                'Test with sample cases FIRST',
                'Test edge cases: N=1, N=0, negative numbers, max values',
                'Add assertions for invariants',
                'Print intermediate values to trace logic',
                'Compare brute force with optimized solution on small inputs',
                'Check for integer overflow, array bounds',
                'Verify loop bounds and termination conditions'
            ],
            readingProblems: [
                'Highlight constraints - they hint at expected complexity',
                'Identify input/output format carefully',
                'Note the range of values (affects data types)',
                'Look for special cases mentioned in problem',
                'Re-read before coding to catch missed details'
            ],
            commonMistakes: [
                'Not reading problem completely',
                'Ignoring constraints (TLE/MLE)',
                'Integer overflow (use long long when needed)',
                'Array index out of bounds',
                'Not handling multiple test cases properly',
                'Submitting to wrong problem',
                'Forgetting to reset global variables between test cases'
            ],
            cppTemplate: `#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
typedef pair<int, int> pii;
typedef vector<int> vi;
typedef vector<ll> vll;

#define FOR(i, a, b) for (int i = (a); i < (b); i++)
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()

const int MOD = 1e9 + 7;
const int INF = 1e9;
const ll LINF = 1e18;

void solve() {
    // Solution here
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t = 1;
    // cin >> t;  // uncomment for multiple test cases
    while (t--) solve();

    return 0;
}`
        }
    },

    /**
     * Initialize cheatsheet module
     */
    init() {
        this.createToggleButton();
        this.wireEvents();
    },

    /**
     * Create toggle button in header
     */
    createToggleButton() {
        const header = document.querySelector('header');
        if (!header) return;

        const btn = document.createElement('button');
        btn.id = 'cheatsheet-toggle';
        btn.className = 'btn-cheatsheet-toggle';
        btn.innerHTML = '<span class="cheatsheet-icon"></span> CP Cheatsheet';
        btn.title = 'Toggle Competitive Programming Cheatsheet';
        header.appendChild(btn);
    },

    /**
     * Wire event listeners
     */
    wireEvents() {
        // Toggle button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#cheatsheet-toggle')) {
                this.toggle();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    },

    /**
     * Toggle cheatsheet visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Show cheatsheet
     */
    show() {
        let container = document.getElementById('cheatsheet-container');
        if (!container) {
            container = this.createContainer();
            document.body.appendChild(container);
        }
        container.classList.remove('hidden');
        this.isVisible = true;
        document.body.style.overflow = 'hidden';
    },

    /**
     * Hide cheatsheet
     */
    hide() {
        const container = document.getElementById('cheatsheet-container');
        if (container) {
            container.classList.add('hidden');
        }
        this.isVisible = false;
        document.body.style.overflow = '';
    },

    /**
     * Create cheatsheet container
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'cheatsheet-container';
        container.className = 'cheatsheet-container hidden';
        container.innerHTML = this.renderCheatsheet();

        // Wire internal events
        container.addEventListener('click', (e) => {
            // Close button
            if (e.target.closest('.cheatsheet-close')) {
                this.hide();
            }
            // Section toggle
            if (e.target.closest('.cheatsheet-section-header')) {
                const section = e.target.closest('.cheatsheet-section');
                if (section) {
                    section.classList.toggle('expanded');
                }
            }
            // Tab switch
            if (e.target.closest('.cheatsheet-tab')) {
                this.switchTab(e.target.closest('.cheatsheet-tab').dataset.tab);
            }
            // Copy code button
            if (e.target.closest('.copy-code-btn')) {
                this.copyCode(e.target.closest('.copy-code-btn'));
            }
        });

        // Search functionality
        container.addEventListener('input', (e) => {
            if (e.target.id === 'cheatsheet-search') {
                this.search(e.target.value);
            }
        });

        return container;
    },

    /**
     * Render full cheatsheet HTML
     */
    renderCheatsheet() {
        return `
            <div class="cheatsheet-overlay" onclick="Cheatsheet.hide()"></div>
            <div class="cheatsheet-modal">
                <div class="cheatsheet-header">
                    <h2>Competitive Programming Cheatsheet</h2>
                    <div class="cheatsheet-controls">
                        <input type="text" id="cheatsheet-search" placeholder="Search topics, formulas, code..." />
                        <button class="cheatsheet-close" title="Close">&times;</button>
                    </div>
                </div>

                <div class="cheatsheet-tabs">
                    <button class="cheatsheet-tab active" data-tab="strategies">Strategies by Tag</button>
                    <button class="cheatsheet-tab" data-tab="formulas">Formulas & Tricks</button>
                    <button class="cheatsheet-tab" data-tab="complexity">Time Complexity</button>
                    <button class="cheatsheet-tab" data-tab="contest">Contest Tips</button>
                </div>

                <div class="cheatsheet-content">
                    <div class="cheatsheet-panel active" id="panel-strategies">
                        ${this.renderStrategies()}
                    </div>
                    <div class="cheatsheet-panel" id="panel-formulas">
                        ${this.renderFormulas()}
                    </div>
                    <div class="cheatsheet-panel" id="panel-complexity">
                        ${this.renderComplexity()}
                    </div>
                    <div class="cheatsheet-panel" id="panel-contest">
                        ${this.renderContestTips()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render strategies section
     */
    renderStrategies() {
        const strategies = this.data.strategies;
        let html = '<div class="strategies-grid">';

        for (const [key, strategy] of Object.entries(strategies)) {
            html += `
                <div class="cheatsheet-section" data-section="${key}">
                    <div class="cheatsheet-section-header">
                        <span class="section-icon section-icon-${strategy.icon}"></span>
                        <h3>${strategy.title}</h3>
                        <span class="section-toggle">+</span>
                    </div>
                    <div class="cheatsheet-section-content">
                        <div class="strategy-subsection">
                            <h4>Key Concepts</h4>
                            <ul>
                                ${strategy.concepts.map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        </div>

                        <div class="strategy-subsection">
                            <h4>Common Patterns</h4>
                            <ul>
                                ${strategy.patterns.map(p => `<li>${p}</li>`).join('')}
                            </ul>
                        </div>

                        <div class="strategy-subsection">
                            <h4>Code Template</h4>
                            <div class="code-block">
                                <button class="copy-code-btn" title="Copy code">Copy</button>
                                <pre><code>${this.escapeHtml(strategy.code)}</code></pre>
                            </div>
                        </div>

                        <div class="strategy-subsection">
                            <h4>Time Complexity</h4>
                            <p class="complexity-note">${strategy.complexity}</p>
                        </div>

                        <div class="strategy-subsection pitfalls">
                            <h4>Common Pitfalls</h4>
                            <ul>
                                ${strategy.pitfalls.map(p => `<li class="pitfall-item">${p}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Render formulas section
     */
    renderFormulas() {
        const formulas = this.data.formulas;
        let html = '<div class="formulas-container">';

        for (const [key, category] of Object.entries(formulas)) {
            html += `
                <div class="cheatsheet-section expanded" data-section="${key}">
                    <div class="cheatsheet-section-header">
                        <h3>${category.title}</h3>
                        <span class="section-toggle">-</span>
                    </div>
                    <div class="cheatsheet-section-content">
                        <div class="formula-cards">
                            ${category.items.map(item => `
                                <div class="formula-card">
                                    <span class="formula-name">${item.name}</span>
                                    <code class="formula-code">${item.formula}</code>
                                </div>
                            `).join('')}
                        </div>
                        ${category.code ? `
                            <div class="code-block">
                                <button class="copy-code-btn" title="Copy code">Copy</button>
                                <pre><code>${this.escapeHtml(category.code)}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Render complexity section
     */
    renderComplexity() {
        const { guide, tips } = this.data.complexity;

        return `
            <div class="complexity-container">
                <div class="complexity-table-wrapper">
                    <h3>Constraint to Complexity Mapping</h3>
                    <table class="complexity-table">
                        <thead>
                            <tr>
                                <th>N (Constraint)</th>
                                <th>Max Complexity</th>
                                <th>Typical Algorithms</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${guide.map(row => `
                                <tr>
                                    <td class="constraint-cell">${row.n}</td>
                                    <td class="complexity-cell">${row.allowed}</td>
                                    <td class="note-cell">${row.note}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="complexity-tips">
                    <h3>General Tips</h3>
                    <ul>
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>

                <div class="complexity-calculator">
                    <h3>Quick Calculator</h3>
                    <p>Given N = <input type="number" id="complexity-n" value="100000" min="1" />,
                    approximately <span id="complexity-result">10^5</span> operations needed for O(N).</p>
                    <p class="calc-hint">For O(N log N): ~1.7 million ops | O(N^2): ~10 billion ops (TLE!)</p>
                </div>
            </div>
        `;
    },

    /**
     * Render contest tips section
     */
    renderContestTips() {
        const tips = this.data.contestTips;

        return `
            <div class="contest-tips-container">
                <div class="tips-grid">
                    <div class="tips-card">
                        <h3>Time Management</h3>
                        <ul>
                            ${tips.timeManagement.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="tips-card">
                        <h3>When to Skip a Problem</h3>
                        <ul>
                            ${tips.whenToSkip.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="tips-card">
                        <h3>Debugging Checklist</h3>
                        <ul>
                            ${tips.debugging.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="tips-card">
                        <h3>Reading Problems</h3>
                        <ul>
                            ${tips.readingProblems.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="tips-card warning-card">
                        <h3>Common Mistakes to Avoid</h3>
                        <ul>
                            ${tips.commonMistakes.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="template-section">
                    <h3>C++ Template</h3>
                    <div class="code-block">
                        <button class="copy-code-btn" title="Copy code">Copy</button>
                        <pre><code>${this.escapeHtml(tips.cppTemplate)}</code></pre>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Switch between tabs
     */
    switchTab(tabId) {
        // Update tabs
        document.querySelectorAll('.cheatsheet-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update panels
        document.querySelectorAll('.cheatsheet-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabId}`);
        });
    },

    /**
     * Search through cheatsheet content
     */
    search(query) {
        this.searchTerm = query.toLowerCase();
        const sections = document.querySelectorAll('.cheatsheet-section');

        sections.forEach(section => {
            const content = section.textContent.toLowerCase();
            const matches = !this.searchTerm || content.includes(this.searchTerm);
            section.style.display = matches ? '' : 'none';

            if (matches && this.searchTerm) {
                section.classList.add('expanded');
            }
        });

        // Also search in other panels
        const cards = document.querySelectorAll('.tips-card, .formula-card');
        cards.forEach(card => {
            const content = card.textContent.toLowerCase();
            const matches = !this.searchTerm || content.includes(this.searchTerm);
            card.style.display = matches ? '' : 'none';
        });
    },

    /**
     * Copy code to clipboard
     */
    async copyCode(button) {
        const codeBlock = button.closest('.code-block');
        const code = codeBlock.querySelector('code').textContent;

        try {
            await navigator.clipboard.writeText(code);
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = 'Copy';
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            button.textContent = 'Failed';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }
    },

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Cheatsheet.init());
