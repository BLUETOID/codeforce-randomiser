// Cheatsheet Page module - Dedicated page for CP tips and tricks

const CheatsheetPage = {
    initialized: false,

    /**
     * Initialize the cheatsheet page
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.render();
    },

    /**
     * Render the cheatsheet page
     */
    render() {
        const container = document.getElementById('cheatsheet-page-content');
        if (!container) return;

        container.innerHTML = `
            <div class="cheatsheet-header">
                <h1>Competitive Programming Cheatsheet</h1>
                <p class="cheatsheet-subtitle">Essential tips, formulas, and strategies for problem solving</p>
            </div>

            <div class="cheatsheet-categories">
                ${this.generateCategoryNav()}
            </div>

            <div class="cheatsheet-content">
                ${this.generateContent()}
            </div>
        `;

        // Wire up category navigation
        this.wireEvents();
    },

    /**
     * Generate category navigation
     */
    generateCategoryNav() {
        const categories = [
            { id: 'dp', name: 'Dynamic Programming', icon: '<i class="fa-solid fa-chart-line"></i>' },
            { id: 'graphs', name: 'Graphs', icon: '<i class="fa-solid fa-project-diagram"></i>' },
            { id: 'math', name: 'Math & Number Theory', icon: '<i class="fa-solid fa-calculator"></i>' },
            { id: 'ds', name: 'Data Structures', icon: '<i class="fa-solid fa-layer-group"></i>' },
            { id: 'strings', name: 'Strings', icon: '<i class="fa-solid fa-font"></i>' },
            { id: 'techniques', name: 'Techniques', icon: '<i class="fa-solid fa-lightbulb"></i>' },
            { id: 'complexity', name: 'Complexity', icon: '<i class="fa-solid fa-stopwatch"></i>' },
            { id: 'templates', name: 'Templates', icon: '<i class="fa-solid fa-file-code"></i>' }
        ];

        return categories.map(cat => `
            <button class="category-btn" data-category="${cat.id}">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
            </button>
        `).join('');
    },

    /**
     * Wire up events
     */
    wireEvents() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                const section = document.getElementById(`section-${category}`);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight active button
                    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    },

    /**
     * Generate all content sections
     */
    generateContent() {
        return `
            ${this.generateDPSection()}
            ${this.generateGraphsSection()}
            ${this.generateMathSection()}
            ${this.generateDSSection()}
            ${this.generateStringsSection()}
            ${this.generateTechniquesSection()}
            ${this.generateComplexitySection()}
            ${this.generateTemplatesSection()}
        `;
    },

    /**
     * Generate DP section
     */
    generateDPSection() {
        return `
            <section id="section-dp" class="cheatsheet-section">
                <h2><i class="fa-solid fa-chart-line"></i> Dynamic Programming</h2>

                <div class="cheatsheet-card">
                    <h3>When to Use DP</h3>
                    <ul>
                        <li><strong>Optimal Substructure:</strong> Optimal solution contains optimal solutions to subproblems</li>
                        <li><strong>Overlapping Subproblems:</strong> Same subproblems are solved multiple times</li>
                        <li><strong>Keywords:</strong> "minimum", "maximum", "count ways", "is it possible"</li>
                    </ul>
                </div>

                <div class="cheatsheet-card">
                    <h3>Common DP Patterns</h3>
                    <div class="pattern-grid">
                        <div class="pattern-item">
                            <h4>1D DP</h4>
                            <code>dp[i] = f(dp[i-1], dp[i-2], ...)</code>
                            <p>Fibonacci, Climbing Stairs, House Robber</p>
                        </div>
                        <div class="pattern-item">
                            <h4>2D DP</h4>
                            <code>dp[i][j] = f(dp[i-1][j], dp[i][j-1])</code>
                            <p>LCS, Edit Distance, Grid Paths</p>
                        </div>
                        <div class="pattern-item">
                            <h4>Knapsack</h4>
                            <code>dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w-weight[i]])</code>
                            <p>0/1 Knapsack, Subset Sum, Coin Change</p>
                        </div>
                        <div class="pattern-item">
                            <h4>Interval DP</h4>
                            <code>dp[i][j] = f(dp[i][k], dp[k+1][j]) for i &le; k &lt; j</code>
                            <p>Matrix Chain, Burst Balloons, Palindrome Partitioning</p>
                        </div>
                    </div>
                </div>

                <div class="cheatsheet-card">
                    <h3>DP State Optimization</h3>
                    <ul>
                        <li><strong>Space:</strong> If dp[i] only depends on dp[i-1], use two variables or rolling array</li>
                        <li><strong>Prefix Sums:</strong> Precompute sums for range queries in O(1)</li>
                        <li><strong>Bitmask DP:</strong> States as binary masks when n &le; 20</li>
                    </ul>
                </div>
            </section>
        `;
    },

    /**
     * Generate Graphs section
     */
    generateGraphsSection() {
        return `
            <section id="section-graphs" class="cheatsheet-section">
                <h2><i class="fa-solid fa-project-diagram"></i> Graphs</h2>

                <div class="cheatsheet-card">
                    <h3>Graph Representations</h3>
                    <div class="code-comparison">
                        <div class="code-block">
                            <h4>Adjacency List (Preferred)</h4>
                            <pre>vector&lt;vector&lt;int&gt;&gt; adj(n);
adj[u].push_back(v);</pre>
                            <p>Space: O(V + E), Best for sparse graphs</p>
                        </div>
                        <div class="code-block">
                            <h4>Edge List</h4>
                            <pre>vector&lt;tuple&lt;int,int,int&gt;&gt; edges;
edges.push_back({u, v, w});</pre>
                            <p>Best for Kruskal's MST</p>
                        </div>
                    </div>
                </div>

                <div class="cheatsheet-card">
                    <h3>Essential Algorithms</h3>
                    <table class="algo-table">
                        <tr>
                            <th>Algorithm</th>
                            <th>Use Case</th>
                            <th>Complexity</th>
                        </tr>
                        <tr>
                            <td>BFS</td>
                            <td>Shortest path (unweighted), Level order</td>
                            <td>O(V + E)</td>
                        </tr>
                        <tr>
                            <td>DFS</td>
                            <td>Connectivity, Cycle detection, Topological sort</td>
                            <td>O(V + E)</td>
                        </tr>
                        <tr>
                            <td>Dijkstra</td>
                            <td>Shortest path (positive weights)</td>
                            <td>O((V + E) log V)</td>
                        </tr>
                        <tr>
                            <td>Bellman-Ford</td>
                            <td>Shortest path (negative edges, no neg cycle)</td>
                            <td>O(V * E)</td>
                        </tr>
                        <tr>
                            <td>Floyd-Warshall</td>
                            <td>All-pairs shortest path</td>
                            <td>O(V&sup3;)</td>
                        </tr>
                        <tr>
                            <td>Kruskal/Prim</td>
                            <td>Minimum Spanning Tree</td>
                            <td>O(E log E)</td>
                        </tr>
                    </table>
                </div>

                <div class="cheatsheet-card">
                    <h3>Important Properties</h3>
                    <ul>
                        <li><strong>Tree:</strong> Connected graph with n nodes and n-1 edges (no cycles)</li>
                        <li><strong>Bipartite:</strong> Can be 2-colored, no odd-length cycles</li>
                        <li><strong>DAG:</strong> Directed Acyclic Graph - has topological ordering</li>
                        <li><strong>Euler Path:</strong> Visits every edge exactly once (0 or 2 odd-degree vertices)</li>
                    </ul>
                </div>
            </section>
        `;
    },

    /**
     * Generate Math section
     */
    generateMathSection() {
        return `
            <section id="section-math" class="cheatsheet-section">
                <h2><i class="fa-solid fa-calculator"></i> Math & Number Theory</h2>

                <div class="cheatsheet-card">
                    <h3>Essential Formulas</h3>
                    <div class="formula-grid">
                        <div class="formula-item">
                            <span class="formula">Sum 1 to n: n(n+1)/2</span>
                        </div>
                        <div class="formula-item">
                            <span class="formula">Sum of squares: n(n+1)(2n+1)/6</span>
                        </div>
                        <div class="formula-item">
                            <span class="formula">Geometric: a(r&sup{n}-1)/(r-1)</span>
                        </div>
                        <div class="formula-item">
                            <span class="formula">nCr = n! / (r! * (n-r)!)</span>
                        </div>
                        <div class="formula-item">
                            <span class="formula">nPr = n! / (n-r)!</span>
                        </div>
                        <div class="formula-item">
                            <span class="formula">GCD(a,b) * LCM(a,b) = a * b</span>
                        </div>
                    </div>
                </div>

                <div class="cheatsheet-card">
                    <h3>Modular Arithmetic</h3>
                    <ul>
                        <li><code>(a + b) % m = ((a % m) + (b % m)) % m</code></li>
                        <li><code>(a * b) % m = ((a % m) * (b % m)) % m</code></li>
                        <li><code>(a - b) % m = ((a % m) - (b % m) + m) % m</code></li>
                        <li><strong>Modular inverse:</strong> a<sup>-1</sup> &equiv; a<sup>m-2</sup> (mod m) when m is prime</li>
                        <li><strong>Common MOD:</strong> 10<sup>9</sup> + 7 = 1000000007 (prime)</li>
                    </ul>
                </div>

                <div class="cheatsheet-card">
                    <h3>Prime Numbers</h3>
                    <ul>
                        <li><strong>Trial Division:</strong> Check divisibility up to &radic;n</li>
                        <li><strong>Sieve of Eratosthenes:</strong> Find all primes up to n in O(n log log n)</li>
                        <li><strong>Prime Factorization:</strong> O(&radic;n) per number</li>
                        <li><strong>Number of divisors:</strong> If n = p<sub>1</sub><sup>a<sub>1</sub></sup> * p<sub>2</sub><sup>a<sub>2</sub></sup> * ... then d(n) = (a<sub>1</sub>+1)(a<sub>2</sub>+1)...</li>
                    </ul>
                </div>
            </section>
        `;
    },

    /**
     * Generate Data Structures section
     */
    generateDSSection() {
        return `
            <section id="section-ds" class="cheatsheet-section">
                <h2><i class="fa-solid fa-layer-group"></i> Data Structures</h2>

                <div class="cheatsheet-card">
                    <h3>When to Use What</h3>
                    <table class="ds-table">
                        <tr>
                            <th>Need</th>
                            <th>Use</th>
                            <th>Operations</th>
                        </tr>
                        <tr>
                            <td>Fast lookup by key</td>
                            <td>unordered_map / map</td>
                            <td>O(1) / O(log n)</td>
                        </tr>
                        <tr>
                            <td>Sorted elements</td>
                            <td>set / multiset</td>
                            <td>O(log n) all ops</td>
                        </tr>
                        <tr>
                            <td>Range min/max/sum</td>
                            <td>Segment Tree</td>
                            <td>O(log n) query/update</td>
                        </tr>
                        <tr>
                            <td>Range sum + point update</td>
                            <td>Fenwick Tree (BIT)</td>
                            <td>O(log n) both</td>
                        </tr>
                        <tr>
                            <td>Union-Find</td>
                            <td>DSU</td>
                            <td>O(&alpha;(n)) ~ O(1)</td>
                        </tr>
                        <tr>
                            <td>Priority access</td>
                            <td>priority_queue</td>
                            <td>O(log n) push/pop</td>
                        </tr>
                        <tr>
                            <td>LIFO</td>
                            <td>stack</td>
                            <td>O(1) all ops</td>
                        </tr>
                        <tr>
                            <td>FIFO</td>
                            <td>queue / deque</td>
                            <td>O(1) all ops</td>
                        </tr>
                    </table>
                </div>

                <div class="cheatsheet-card">
                    <h3>Segment Tree Tips</h3>
                    <ul>
                        <li>Use 4n array size to be safe</li>
                        <li>Lazy propagation for range updates</li>
                        <li>Can store any associative operation (min, max, sum, gcd, xor)</li>
                    </ul>
                </div>
            </section>
        `;
    },

    /**
     * Generate Strings section
     */
    generateStringsSection() {
        return `
            <section id="section-strings" class="cheatsheet-section">
                <h2><i class="fa-solid fa-font"></i> Strings</h2>

                <div class="cheatsheet-card">
                    <h3>String Algorithms</h3>
                    <table class="algo-table">
                        <tr>
                            <th>Algorithm</th>
                            <th>Use Case</th>
                            <th>Complexity</th>
                        </tr>
                        <tr>
                            <td>KMP</td>
                            <td>Pattern matching</td>
                            <td>O(n + m)</td>
                        </tr>
                        <tr>
                            <td>Z-Algorithm</td>
                            <td>Pattern matching, longest common prefix</td>
                            <td>O(n)</td>
                        </tr>
                        <tr>
                            <td>Rabin-Karp</td>
                            <td>Multiple pattern matching (hashing)</td>
                            <td>O(n + m) avg</td>
                        </tr>
                        <tr>
                            <td>Trie</td>
                            <td>Prefix queries, autocomplete</td>
                            <td>O(length) per operation</td>
                        </tr>
                        <tr>
                            <td>Manacher's</td>
                            <td>All palindromic substrings</td>
                            <td>O(n)</td>
                        </tr>
                    </table>
                </div>

                <div class="cheatsheet-card">
                    <h3>String Hashing</h3>
                    <pre>const ll MOD = 1e9 + 7;
const ll BASE = 31;

ll hash(string& s) {
    ll h = 0, p = 1;
    for (char c : s) {
        h = (h + (c - 'a' + 1) * p) % MOD;
        p = (p * BASE) % MOD;
    }
    return h;
}</pre>
                    <p><strong>Tip:</strong> Use double hashing (two different MODs) to reduce collision probability</p>
                </div>
            </section>
        `;
    },

    /**
     * Generate Techniques section
     */
    generateTechniquesSection() {
        return `
            <section id="section-techniques" class="cheatsheet-section">
                <h2><i class="fa-solid fa-lightbulb"></i> Problem-Solving Techniques</h2>

                <div class="cheatsheet-card">
                    <h3>Two Pointers</h3>
                    <ul>
                        <li><strong>Same direction:</strong> Sliding window, finding subarrays</li>
                        <li><strong>Opposite direction:</strong> Pair finding, palindrome check</li>
                        <li><strong>Key insight:</strong> One property moves left, another moves right</li>
                    </ul>
                    <p><strong>When to use:</strong> Sorted array, finding pairs, subarray problems</p>
                </div>

                <div class="cheatsheet-card">
                    <h3>Binary Search</h3>
                    <ul>
                        <li><strong>On answer:</strong> "Find minimum/maximum X such that condition P(X)"</li>
                        <li><strong>Monotonic condition:</strong> If P(x) is true, P(x+1) should also be true (or vice versa)</li>
                        <li><strong>Common template:</strong></li>
                    </ul>
                    <pre>ll lo = MIN, hi = MAX;
while (lo < hi) {
    ll mid = lo + (hi - lo) / 2;
    if (check(mid)) hi = mid;
    else lo = mid + 1;
}
// lo is the answer</pre>
                </div>

                <div class="cheatsheet-card">
                    <h3>Greedy Validation</h3>
                    <ul>
                        <li>Prove greedy choice is always part of some optimal solution</li>
                        <li><strong>Exchange argument:</strong> Show swapping to greedy doesn't hurt</li>
                        <li><strong>Stay ahead:</strong> Greedy stays at least as good at every step</li>
                    </ul>
                </div>

                <div class="cheatsheet-card">
                    <h3>Meet in the Middle</h3>
                    <p>Split problem in half, solve each half, combine results</p>
                    <ul>
                        <li>Reduces O(2<sup>n</sup>) to O(2<sup>n/2</sup>)</li>
                        <li>Good for n &le; 40</li>
                        <li><strong>Example:</strong> 4-sum problem, subset sum</li>
                    </ul>
                </div>
            </section>
        `;
    },

    /**
     * Generate Complexity section
     */
    generateComplexitySection() {
        return `
            <section id="section-complexity" class="cheatsheet-section">
                <h2><i class="fa-solid fa-stopwatch"></i> Time Complexity Guide</h2>

                <div class="cheatsheet-card">
                    <h3>Operations per Second</h3>
                    <p>Assume ~10<sup>8</sup> simple operations per second</p>
                    <table class="complexity-table">
                        <tr>
                            <th>n</th>
                            <th>Max Complexity</th>
                            <th>Examples</th>
                        </tr>
                        <tr>
                            <td>&le; 10</td>
                            <td>O(n!), O(n<sup>n</sup>)</td>
                            <td>Permutations, brute force</td>
                        </tr>
                        <tr>
                            <td>&le; 20</td>
                            <td>O(2<sup>n</sup>)</td>
                            <td>Bitmask DP, subset enumeration</td>
                        </tr>
                        <tr>
                            <td>&le; 100</td>
                            <td>O(n<sup>4</sup>)</td>
                            <td>4 nested loops</td>
                        </tr>
                        <tr>
                            <td>&le; 500</td>
                            <td>O(n<sup>3</sup>)</td>
                            <td>Floyd-Warshall, interval DP</td>
                        </tr>
                        <tr>
                            <td>&le; 5000</td>
                            <td>O(n<sup>2</sup>)</td>
                            <td>Simple DP, bubble sort</td>
                        </tr>
                        <tr>
                            <td>&le; 10<sup>6</sup></td>
                            <td>O(n log n)</td>
                            <td>Sorting, segment tree, binary search</td>
                        </tr>
                        <tr>
                            <td>&le; 10<sup>8</sup></td>
                            <td>O(n)</td>
                            <td>Linear scan, simple DP</td>
                        </tr>
                        <tr>
                            <td>> 10<sup>8</sup></td>
                            <td>O(log n), O(1)</td>
                            <td>Binary search, math formula</td>
                        </tr>
                    </table>
                </div>
            </section>
        `;
    },

    /**
     * Generate Templates section
     */
    generateTemplatesSection() {
        return `
            <section id="section-templates" class="cheatsheet-section">
                <h2><i class="fa-solid fa-file-code"></i> Code Templates</h2>

                <div class="cheatsheet-card">
                    <h3>Competition Header</h3>
                    <pre>#include &lt;bits/stdc++.h&gt;
using namespace std;

typedef long long ll;
typedef pair&lt;int, int&gt; pii;
typedef vector&lt;int&gt; vi;

#define pb push_back
#define all(x) (x).begin(), (x).end()
#define FOR(i, a, b) for (int i = (a); i < (b); i++)

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
    // cin >> t;
    while (t--) solve();
    return 0;
}</pre>
                </div>

                <div class="cheatsheet-card">
                    <h3>DSU (Disjoint Set Union)</h3>
                    <pre>struct DSU {
    vector&lt;int&gt; parent, rank_;
    DSU(int n) : parent(n), rank_(n, 0) {
        iota(all(parent), 0);
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x];
    }
    void unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return;
        if (rank_[x] < rank_[y]) swap(x, y);
        parent[y] = x;
        if (rank_[x] == rank_[y]) rank_[x]++;
    }
};</pre>
                </div>

                <div class="cheatsheet-card">
                    <h3>Binary Exponentiation</h3>
                    <pre>ll power(ll base, ll exp, ll mod) {
    ll result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}</pre>
                </div>
            </section>
        `;
    }
};
