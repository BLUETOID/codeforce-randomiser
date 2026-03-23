# Codeforces Problem Randomizer

A smart problem randomizer for Codeforces that helps you find practice problems based on rating, tags, contest type, and more!

## Features

### Core Features
- **Rating-based filtering**: Find problems in your skill range (800-3500)
- **Tag-based search**: Filter by specific topics (DP, graphs, math, greedy, etc.)
- **Contest type filter**: Practice problems from specific contest divisions or educational rounds
- **Problem statistics**: See how many people have solved each problem
- **Problem history**: Automatically tracks problems you've seen to avoid duplicates
- **Exclude solved problems**: Enter your Codeforces handle to skip problems you've already solved
- **Responsive design**: Works great on desktop and mobile
- **Dark mode**: Toggle between light and dark themes (automatically saved)
- **Practice timer**: Built-in timer to track your solving time
- **Profile integration**: Load CF profile to see your rating, rank, and detailed analytics
- **Dedicated pages**: Home, Profile, Recommendations, and Cheatsheet are separated for a cleaner flow

### Smart Features
- **Local caching**: API responses are cached to reduce load times
- **Real-time filtering**: See how many problems match your criteria before randomizing
- **Weak tags analysis**: Get personalized recommendations for topics you solve less frequently
- **Recommendations page**: View your practice guide and suggested problems on a separate page
- **Accurate streak tracking**: Submission streak calculations are based on local day boundaries
- **Auto-retry**: Automatic retry with exponential backoff when API fails
- **Connection status**: Real-time connection monitoring
- **Filter preferences**: Automatically saves your last filter settings across sessions

## Getting Started

### Web Interface

#### Quick Start
1. Open `index.html` in your web browser
2. Set your desired rating range (e.g., 800-1200 for beginners)
3. Optionally select tags you want to practice
4. Click "Get Random Problem"
5. Start solving!

#### Advanced Usage
1. **Dark Mode**: Click the theme toggle in the top-right to switch themes
2. **Profile Stats**: Enter your CF handle and click "Load Profile" to:
   - Exclude problems you've already solved
   - See your rating, rank, max rating, and solve count
   - Get weak tag recommendations for topics you should practice
3. **Contest Filter**: Select specific contest types (Div. 1, Div. 2, Educational, etc.)
4. **Problem History**: Check "Skip problems I've already seen" to avoid repeats
5. **Tag Matching**: Choose "Match ANY" or "Match ALL" for flexible tag filtering
6. **Practice Timer**: After getting a problem, click "Start Timer" to track your solving time
7. **Weak Tags**: After loading your profile, click "Apply These Tags" to practice recommended topics
8. **Recommendations Page**: Open the Recommendations tab to see your personalized guide and suggested problems

### CLI Tool

#### Installation
```bash
cd cli
npm install
```

#### Usage

**Basic usage** (800-1400 rating range by default):
```bash
node cf-random.js
```

**Specify rating range and tags**:
```bash
node cf-random.js --min 1000 --max 1500 --tags dp,greedy
```

**Exclude problems you've solved**:
```bash
node cf-random.js --min 1200 --max 1600 --exclude your_cf_handle
```

**Require ALL tags** (instead of ANY):
```bash
node cf-random.js --min 1400 --max 1800 --tags dp,graphs --all
```

**List all available tags**:
```bash
node cf-random.js --list-tags
```

#### CLI Options
```
--min <rating>      Minimum problem rating (default: 800)
--max <rating>      Maximum problem rating (default: 1400)
--tags <tags>       Comma-separated list of tags (e.g., dp,greedy)
--all               Require ALL tags instead of ANY
--exclude <handle>  Exclude problems solved by this Codeforces handle
--list-tags         List all available problem tags
```

## How It Works

1. **Fetches problems**: Uses the Codeforces API to get all available problems
2. **Loads profile** (optional): Fetches your CF profile stats, submissions, and analyzes weak areas
3. **Applies filters**: Filters by rating, tags, contest type, and your preferences
4. **Excludes solved & seen**: Removes problems you've solved and previously randomized
5. **Tracks history**: Saves problems you've seen to localStorage to avoid repeats
6. **Random selection**: Picks a random problem from the filtered list
7. **Displays stats**: Shows solve count, rating, tags, and direct link to CF
8. **Timer tracking**: Optional timer to track your solving time
9. **Recommendations routing**: Shows recommendations on a dedicated page instead of the Home layout

### Profile Analysis
When you load your profile, the app:
- Fetches all your submissions from CF
- Counts solved problems by tag
- Identifies your 5 weakest tags (topics you solve least)
- Recommends these tags for practice
- Displays your current rating, max rating, and rank with proper color coding
- Generates submission heatmap stats with consistent current/longest streak values

### Caching Strategy
- Problem list: 1 hour (problems don't change often)
- User submissions: 15 minutes (you might solve new problems)
- User profile info: 30 minutes (rating changes less frequently)
- Problem history: Persisted indefinitely (cleared manually)
- Filter preferences: Persisted indefinitely

## Tips for Effective Practice

### For Beginners (< 1200 rating)
- Start with rating 800-1000
- Focus on: `implementation`, `brute force`, `math`, `greedy`
- Don't skip basics - solve at least 50 problems in this range

### For Intermediate (1200-1800 rating)
- Practice rating 1200-1500
- Important tags: `dp`, `binary search`, `dfs and similar`, `data structures`
- Try to solve problems from Educational rounds (they have better editorials)

### For Advanced (> 1800 rating)
- Mix rating 1600-2200
- Focus on weak areas using tag filtering
- Practice from Div. 1 and Global rounds

### General Tips
- Use "Match ALL tags" when you want to practice specific combinations (e.g., DP + graphs)
- Enable "Skip seen problems" to avoid getting the same problem twice
- Track your solved problems by validating your handle regularly

## Tech Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks - lightweight and fast!)
- **CLI**: Node.js with commander.js for argument parsing
- **Data Source**: Codeforces API
- **Storage**: localStorage for caching and history

## Caching

The app caches API responses to improve performance and reduce API calls:
- **Problem list**: Cached for 1 hour (problems rarely change)
- **User submissions**: Cached for 15 minutes (you might solve new problems)
- **User profile info**: Cached for 30 minutes (rating changes occur less often)
- **Problem history**: Stored indefinitely until manually cleared
- **Filter preferences**: Stored indefinitely, restored on page load

Clear your browser cache (localStorage) if you need fresh data immediately.

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Privacy

- All data is stored locally in your browser
- No server-side storage or tracking
- Your Codeforces handle is only used to fetch your submissions via the public CF API
- Problem history is stored in localStorage and never leaves your device

## Troubleshooting

**"No problems match your criteria"**
- Your filters are too restrictive
- Try widening the rating range
- Remove some tags or switch from "ALL" to "ANY" matching
- Disable "Skip seen problems" if you've seen many problems
- Clear your problem history if it's blocking too many results

**"User not found"**
- Double-check your Codeforces handle spelling
- Make sure the user exists on codeforces.com
- Handles are case-sensitive

**API errors / Connection issues**
- The app will automatically retry 3 times with exponential backoff
- Check the connection status indicator (bottom-right)
- Codeforces API might be down or rate-limited - wait and try again
- Check your internet connection
- Try refreshing the page

**Profile not loading**
- Wait a few seconds - loading profiles with many submissions can take time
- Check browser console (F12) for detailed errors
- Clear browser cache and try again
- Make sure the handle exists and is public

**Timer not working**
- Make sure you've clicked "Start Timer" after getting a problem
- Timer is reset when you get a new problem
- Use Pause/Resume for breaks

**Dark mode not persisting**
- Check if browser allows localStorage
- Try in normal (non-incognito) window
- Clear browser data related to the site and set theme again

**Filter preferences not saving**
- localStorage might be full or disabled
- Try in normal (non-incognito) window
- Check browser privacy settings

## Contributing

Found a bug or have a feature request? Feel free to:
- Open an issue
- Submit a pull request
- Suggest improvements

## Credits

- Data powered by [Codeforces API](https://codeforces.com/apiHelp)
- Built for the competitive programming community

## License

Free to use for personal and educational purposes.

---

Happy coding!

Made for competitive programmers.
