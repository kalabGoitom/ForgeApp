# FORGE — Workout Tracker

A sleek, modern mobile workout logging app built with vanilla HTML, CSS, and JavaScript. Track exercises, log sets/reps, monitor progress, and crush your fitness goals.

## Features

### 📱 Home Screen
- **Daily overview** with current date
- **Streak tracker** showing consecutive workout days
- **Weekly stats**: workouts this week, total workouts, PRs set
- **Weekly activity bar** (visual 7-day heatmap)
- **Recent workouts** feed with exercise names and set counts

### ✏️ Log Screen
- **Quick exercise search** with muscle group filtering
- **Custom exercise support** for unlisted movements
- **Set tracking** with weight, reps, and volume calculation
- **Rest timer** (configurable) that auto-starts after each set
- **Performance suggestions** based on last workout
- **Workout notes** for tracking mood/RPE

### 📅 History Screen
- **Complete workout log** sorted by date
- **Expandable details** showing sets/reps per exercise
- **Duration tracking** for each session
- **Custom notes** display

### 📊 Stats Screen
- **Personal records** (PRs) with progress from first lift
- **Strength progress chart** (selectable exercise, visual trend with gradient)
- **Intelligent insights**:
  - Monthly improvement tracking
  - Active streak notifications
  - Total volume lifted (in tons)

### ⚙️ Settings
- **Weight unit toggle** (kg / lb)
- **Configurable goals**: target workouts/week, rest timer duration
- **Clear all data** option with confirmation

## Quick Start

1. Download `workout-tracker.html`
2. Open in any modern browser
3. Start logging workouts immediately (no server needed)
4. All data saves locally to your browser

## Data Storage

All data persists to browser localStorage:
- `forge_workouts` — Array of completed workouts
- `forge_settings` — User preferences (unit, goals)
- `forge_custom_exercises` — User-created exercise names

**Note**: Data is stored locally and never sent to external servers. Clearing browser storage will remove all data.

## Exercise Database

Pre-loaded exercise library organized by muscle group:
- **Chest**: Bench Press, Push-Ups, Cable Fly, Chest Dip, etc.
- **Back**: Deadlift, Pull-Ups, Barbell Row, Lat Pulldown, etc.
- **Shoulders**: Overhead Press, Lateral Raise, Face Pull, etc.
- **Arms**: Barbell Curl, Skull Crusher, Tricep Pushdown, etc.
- **Legs**: Squat, Romanian Deadlift, Leg Curl, Calf Raise, etc.
- **Core**: Plank, Crunch, Russian Twist, Ab Rollout, etc.

Add custom exercises on the fly — any exercise you log is saved for future use.

## Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Accent (Green) | `#00f5a0` | Primary action, highlights, PRs |
| Accent 2 (Cyan) | `#00d4ff` | Secondary elements, suggestions |
| Accent 3 (Red) | `#ff6b6b` | Destructive actions, warnings |
| Background | `#0a0a0b` | Main background |
| Cards | `#16161a` | Card/container backgrounds |
| Muted | `#666674` | Secondary text, metadata |

### Typography
- **Bebas Neue** — Headlines, large displays (52px–42px)
- **DM Sans** — Body text, UI labels (14px–15px)
- **JetBrains Mono** — Numeric data, metadata, section labels (10px–13px)

### Layout
- **Mobile-first** responsive design
- **Fixed bottom nav** (iOS safe-area inset support)
- **Bottom sheet modals** for exercise selection
- **Grid-based spacing** (16px baseline)

## Navigation

5-tab bottom navigation:
1. **Home** — Dashboard & quick stats
2. **Log** — Current workout session
3. **History** — Past workout archive
4. **Stats** — PRs, charts, insights
5. **Settings** — Preferences & data management

## Key Functions

### Core Workout Logic
```javascript
goToLog()                               // Initialize new workout session
saveWorkout()                           // Persist completed workout
updateSet(ei, si, field, val)          // Update weight/reps for a set
addSet(ei)                              // Add set to exercise
removeExercise(ei)                      // Delete exercise from session
```

### Exercise Selection
```javascript
openModal()                             // Show exercise picker
filterExercises()                       // Search exercises by name
selectExercise(name, muscle)            // Add exercise to session
addCustomExercise()                     // Create new custom exercise
```

### Analytics
```javascript
calcStreak()                            // Consecutive workout days
countPRs()                              // Total unique personal records
renderChart()                           // Strength progress curve
renderInsights()                        // AI-style tips and analysis
```

### Timer
```javascript
startTimer()                            // Begin rest period
updateTimerDisplay()                    // Update countdown display
dismissTimer()                          // Close timer overlay
```

## Data Structures

### Settings
```javascript
{
  unit: 'kg' | 'lb',                    // Weight unit
  goalWorkouts: 4,                      // Target workouts per week
  restTimer: 90                         // Rest duration in seconds
}
```

### Workout
```javascript
{
  id: timestamp,
  date: ISO string,
  exercises: [
    {
      name: string,
      muscle: string,
      sets: [
        { weight: number, reps: number },
        ...
      ]
    },
    ...
  ],
  note: string,
  duration: minutes
}
```

## Mobile Considerations

- **Bottom nav** respects iOS notch/safe areas via `env(safe-area-inset-bottom)`
- **Modal slides up** from bottom with smooth easing animation
- **Touch-optimized** button sizes (44px+ minimum tap target)
- **Smooth animations** with `cubic-bezier(0.34, 1.56, 0.64, 1)` easing
- **Scrollable areas** with thin, subtle scrollbars (4px width)
- **Viewport meta tag** ensures proper mobile rendering

## Browser Compatibility

| Feature | Required |
|---------|----------|
| LocalStorage API | ✅ Required |
| HTML5 Canvas | ✅ Required (for charts) |
| ES6 JavaScript | ✅ Required |
| CSS Grid & Flexbox | ✅ Required |

**Supported**: Chrome, Firefox, Safari, Edge (all modern versions)

## Performance

- **Single HTML file** — No build process or dependencies
- **Vanilla JavaScript** — No frameworks or libraries
- **CSS-only animations** — GPU-accelerated smoothness
- **Canvas rendering** — Efficient chart drawing with requestAnimationFrame

## Customization

### Change Color Scheme
Edit the CSS variables at the top of the `<style>` block:
```css
:root {
  --accent: #00f5a0;      /* Primary green */
  --accent2: #00d4ff;     /* Secondary cyan */
  --accent3: #ff6b6b;     /* Error/warning red */
  /* ... more colors */
}
```

### Add Exercises
Modify the `EXERCISE_DB` object in the script section:
```javascript
const EXERCISE_DB = {
  "Chest": ["Bench Press", "Push-Up", "Custom Exercise"],
  // Add more muscle groups or exercises
};
```

### Adjust Rest Timer
Change the default in Settings (90 seconds) or modify:
```javascript
let settings = load('forge_settings', { 
  unit: 'kg', 
  goalWorkouts: 4, 
  restTimer: 120  // Change here
});
```

## Tips for Use

- **Start a session** by tapping the green "START WORKOUT" button on Home
- **Add exercises** via the "+" button in Log mode
- **Enable rest timer** by completing a set (auto-starts countdown)
- **Log custom exercises** that aren't in the database
- **Track PRs** across all exercises in the Stats screen
- **Review history** with expandable workout details
- **Export your data** by downloading from browser dev tools → Application → Local Storage

## Known Limitations

- Data is **browser-specific** (not synced across devices)
- Clearing browser cache **deletes all workouts**
- No built-in backup/export feature (manual localStorage export recommended)
- Chart displays last ~20 workouts for readability

## Version

**FORGE v1.0** — Built with ⚡

---

## License & Attribution

Feel free to fork, modify, and deploy. Designed for personal fitness tracking.

## Future Enhancements

- [ ] Cloud sync & backup
- [ ] Workout templates & programs
- [ ] Muscle group heatmap
- [ ] Exercise video library
- [ ] Social features (share PRs)
- [ ] Dark/light mode toggle
- [ ] Multiple user profiles