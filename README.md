# The Reset Compass

A polished, mobile-first Progressive Web App (PWA) that helps you find your wellness mode and choose short activities to reset your focus, energy, or mood. Built with vanilla HTML, CSS, and JavaScript for maximum performance and compatibility.

## Features

### 🧭 Four Wellness Modes
- **Surviving** 🩺 - Quick fixes when you're running on empty  
- **Drifting** 🧭 - Gentle resets to float back into focus  
- **Grounded** 🌿 - Root yourself with steady, grounding activities  
- **Growing** 🚀 - Boost your mood and expand your capacity

### 🔀 Shuffle Mode
- **Randomized Discovery** - Activities presented in random order using Fisher-Yates shuffle
- **Non-Repeating Deck** - No duplicates until you've seen all activities
- **Keyboard & Swipe Navigation** - Use arrow keys or swipe gestures
- **Optional Repeat Mode** - Enable continuous shuffling when deck exhausted
- **Progress Tracking** - Visual progress bar showing position in deck
- **Smooth Animations** - Hardware-accelerated transitions with reduced-motion support

### ✨ Premium Experience
- Cinematic intro animation with compass spin and fade
- Vibrant glow effects on primary brand color (#0B3D2E)
- Smooth micro-animations on all interactive elements
- Perfect light and dark mode with WCAG AAA contrast
- Gentle compass arrow rotation as you scroll
- Multi-select activities with icon support
- Celebratory confetti and achievement effects

### 🏆 Progress Tracking
- Daily, 7-day, and monthly streak tracking
- Visual donut chart showing mode usage distribution
- Complete activity history with export to JSON
- Achievement badges for milestones
- Encouraging messages and glow pulses on completion

### 📱 Progressive Web App
- Installable on all devices (Add to Home Screen)
- Offline-first with service worker caching
- Mobile-first responsive design (360px to desktop)
- Zero layout shift on load
- Respects prefers-reduced-motion
- Full keyboard and screen reader accessibility

### 💾 Privacy First
- All data stored locally in browser (localStorage)
- No external servers or tracking
- Export your data anytime
- Clear history with one tap

## Quick Start

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd reset-compass
   ```

2. **Serve with any static file server:**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using Node.js (http-server):
   ```bash
   npx http-server -p 8000
   ```
   
   Using Netlify CLI (recommended):
   ```bash
   netlify dev
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Deploy

#### Deploy to Netlify

1. **Via Netlify CLI:**
   ```bash
   netlify deploy --prod
   ```

2. **Via Git:**
   - Connect your repository to Netlify
   - Set build command: (leave empty)
   - Set publish directory: `/`
   - Deploy!

3. **Drag and Drop:**
   - Build your site
   - Drag the entire folder to [Netlify Drop](https://app.netlify.com/drop)

#### Deploy to GitHub Pages

1. **Enable GitHub Pages:**
   - Go to Settings > Pages
   - Set source to main branch, root directory
   - Save

2. **Your site will be live at:**
   ```
   https://<username>.github.io/<repository-name>
   ```

#### Deploy to Other Platforms

The app is 100% static and works on any hosting platform:
- Vercel
- Cloudflare Pages
- Firebase Hosting
- AWS S3
- Any CDN or static host

## Add to Home Screen (A2HS)

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Install"

### Desktop (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install"
4. The app will open in its own window

The app will show an in-app install prompt when eligible.

## Tech Stack

- **HTML5** - Semantic, accessible markup
- **CSS3** - CSS variables, gradients, animations, grid, flexbox
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Service Worker** - Offline caching and PWA functionality
- **Web App Manifest** - PWA metadata and icons
- **Canvas API** - Donut chart visualization
- **LocalStorage** - Client-side data persistence

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## File Structure

```
reset-compass/
├── index.html              # Main app page
├── about.html              # About page
├── style.css               # Core styles
├── css/
│   └── cinematic.css       # Animation and motion styles
├── script.js               # Main app logic
├── js/
│   ├── intro.js            # Cinematic intro animation
│   ├── modes-loader.js     # Mode data loader
│   └── modes-ui.js         # Mode UI rendering
├── assets/
│   ├── compass.svg         # Compass graphic
│   ├── icons/              # Activity icons (SVG)
│   └── images/             # App icons (PNG, SVG)
├── data/
│   └── modes.json          # Mode and activity data
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
└── README.md               # This file
```

## Customization

### Brand Colors

Edit CSS variables in `style.css`:
```css
:root {
  --brand-color: #0B3D2E;      /* Primary brand green */
  --brand-glow: #00E6A6;       /* Vibrant glow accent */
  --color-growing: #0FBF84;    /* Growing mode */
  --color-grounded: #0B3D2E;   /* Grounded mode */
  --color-drifting: #6B46C1;   /* Drifting mode */
  --color-surviving: #D9480F;  /* Surviving mode */
}
```

### Modes & Activities

Edit `data/modes.json` to customize modes and activities:
```json
{
  "modes": [
    {
      "id": "surviving",
      "title": "Surviving",
      "description": "Your description here",
      "color": "#D9480F",
      "activities": [
        {
          "id": "breathe",
          "title": "3 Deep Breaths",
          "icon": "assets/icons/breathe.svg",
          "explain": "Slow breaths to calm your body.",
          "duration": 60
        }
      ]
    }
  ]
}
```

## Ad Integration

The app includes a responsive ad slot placeholder at the bottom of each page. Replace the placeholder in `index.html`:

```html
<div class="ad-slot" aria-label="Advertisement">
  <!-- Replace with your ad code here -->
  <p class="ad-placeholder">Ad Placeholder</p>
</div>
```

## Accessibility

- WCAG AAA color contrast ratios
- Full keyboard navigation support
- ARIA labels and landmarks
- Screen reader friendly
- Focus visible indicators
- Reduced motion support

## Performance

- Zero framework overhead
- Minimal JavaScript bundle
- Optimized animations with `will-change`
- Passive event listeners
- Efficient DOM updates
- Service worker caching

## Privacy & Data

All data is stored locally in your browser:
- `resetCompassHistory` - Activity history
- `resetCompassStreak` - Current streak count
- `resetCompassTheme` - Light/dark mode preference
- `resetCompassLastDay` - Last activity date
- `resetCompassReviews` - User reviews (optional)

Clear all data via the History dialog "Clear History" button.

## Credits

Built with ❤️ by Evolution of Wellness

## License

All rights reserved © 2025 Evolution of Wellness

---

## Development

### TODOs

Current placeholders that need final assets:
- [ ] Replace activity icon SVGs in `assets/icons/` (currently using placeholders)
- [ ] Add final compass graphic to `assets/compass.svg`
- [ ] Update app icons in `assets/images/` (192px, 512px)
- [ ] Replace ad placeholder with actual ad code
- [ ] Update copy in mode descriptions if needed

### Testing Checklist

- [x] Cinematic intro plays on first load
- [x] Compass arrow rotates smoothly on scroll
- [x] All mode views work with multi-select
- [x] Activity icons display correctly
- [x] Donut chart shows accurate percentages
- [x] Streak logic increments daily
- [x] Celebrations trigger on milestones
- [x] Light/dark mode switches correctly
- [x] PWA installs on mobile and desktop
- [x] Offline mode works
- [x] Responsive from 360px to desktop
- [x] No visual bugs or layout shift
- [x] Keyboard navigation works
- [x] Screen readers announce correctly

## Support

For issues or questions, please open an issue on GitHub or contact Evolution of Wellness.
