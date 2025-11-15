# BackgroundVideo Component

A responsive React component that automatically switches between landscape and portrait background GIFs based on viewport aspect ratio.

## Features

- Automatically detects viewport orientation changes in real-time
- Preloads both assets for optimal performance
- Smooth transitions between orientations
- Full viewport coverage with fixed positioning
- Seamless looping GIFs
- Mobile-optimized with dynamic viewport height support
- Loading indicator during asset preloading
- Zero-dependency implementation

## Installation

The component is already integrated into the project. No additional installation needed.

## Usage

### Basic Usage

Wrap your app content with the `BackgroundVideo` component:

```jsx
import BackgroundVideo from './components/BackgroundVideo';

function App() {
  return (
    <BackgroundVideo>
      <div className="your-content">
        {/* Your app content here */}
      </div>
    </BackgroundVideo>
  );
}
```

### Advanced Usage

The component can be used anywhere in your component tree:

```jsx
import BackgroundVideo from './components/BackgroundVideo';

function MyPage() {
  return (
    <BackgroundVideo>
      <header>My Header</header>
      <main>
        <h1>Welcome</h1>
        <p>Content overlays the background</p>
      </main>
      <footer>Footer content</footer>
    </BackgroundVideo>
  );
}
```

### Using the Custom Hook

The `useOrientation` hook is also available for custom implementations:

```jsx
import useOrientation from '../hooks/useOrientation';

function MyComponent() {
  const { isPortrait, aspectRatio } = useOrientation();

  return (
    <div>
      <p>Current orientation: {isPortrait ? 'Portrait' : 'Landscape'}</p>
      <p>Aspect ratio: {aspectRatio.toFixed(2)}</p>
    </div>
  );
}
```

## Configuration

### Changing Background Assets

To use different GIF files, modify the `src` attributes in `BackgroundVideo.js`:

```jsx
// For landscape
landscapeImg.src = process.env.PUBLIC_URL + '/images/YOUR_LANDSCAPE.gif';

// For portrait
portraitImg.src = process.env.PUBLIC_URL + '/images/YOUR_PORTRAIT.gif';
```

### Adjusting Orientation Threshold

By default, the component switches to portrait mode when the aspect ratio is less than 1. To adjust this threshold, modify the comparison in `BackgroundVideo.js`:

```jsx
// Current: switches at 1:1 ratio
setIsPortrait(aspectRatio < 1);

// Example: switch at 4:3 ratio
setIsPortrait(aspectRatio < 4/3);
```

### Customizing Transition Speed

Modify the transition duration in `BackgroundVideo.css`:

```css
.background-video {
  /* Default: 0.5s */
  transition: opacity 0.5s ease-in-out;

  /* Faster: 0.3s */
  /* transition: opacity 0.3s ease-in-out; */

  /* Slower: 1s */
  /* transition: opacity 1s ease-in-out; */
}
```

## Component Architecture

### File Structure

```
frontend/src/
├── components/
│   ├── BackgroundVideo.js       # Main component
│   ├── BackgroundVideo.css      # Styling
│   └── BackgroundVideo.README.md # Documentation
└── hooks/
    └── useOrientation.js        # Reusable orientation hook
```

### How It Works

1. **Preloading**: Both GIF files are preloaded on component mount using Image objects
2. **Orientation Detection**: Window resize events trigger aspect ratio calculations
3. **Conditional Rendering**: CSS opacity transitions create smooth switches between assets
4. **Performance**: Uses `will-change` and hardware acceleration for optimal rendering

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Content to overlay on the background |

### Hook Return Values

`useOrientation()` returns:

| Property | Type | Description |
|----------|------|-------------|
| isPortrait | boolean | True if viewport is portrait orientation |
| aspectRatio | number | Current aspect ratio (width/height) |

## Performance Considerations

- Both GIFs are preloaded to prevent layout shifts
- Uses CSS transforms for positioning (GPU-accelerated)
- `will-change` property hints browser for optimization
- Fixed positioning prevents repaints during scroll
- Loading timeout prevents infinite loading states

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports dynamic viewport units (`dvh`) for modern mobile browsers
- Fallback to standard units for older browsers

## Responsive Behavior

- **Desktop (Landscape)**: Shows `APICONGRESS1.gif`
- **Mobile (Portrait)**: Shows `APICONGRESS5PORTRAIT.gif`
- **Tablets**: Adapts based on current orientation
- **Orientation Changes**: Smooth transitions in real-time

## Troubleshooting

### GIFs not loading
- Verify GIF files are in `/frontend/public/images/`
- Check browser console for 404 errors
- Ensure filenames match exactly (case-sensitive)

### Orientation not switching
- Check browser console for JavaScript errors
- Verify resize event listeners are not blocked
- Test with browser DevTools responsive mode

### Performance issues
- Check GIF file sizes (optimize if >10MB)
- Verify hardware acceleration is enabled
- Test on target devices for actual performance

## Examples

### Example 1: Full-Screen Background

```jsx
// Already implemented in App.js
import BackgroundVideo from './components/BackgroundVideo';

function App() {
  return (
    <BackgroundVideo>
      <div className="App">
        {/* Your content */}
      </div>
    </BackgroundVideo>
  );
}
```

### Example 2: Conditional Background

```jsx
function App() {
  const [showBackground, setShowBackground] = useState(true);

  return (
    <>
      {showBackground && (
        <BackgroundVideo>
          <YourContent />
        </BackgroundVideo>
      )}
      {!showBackground && <YourContent />}
    </>
  );
}
```

### Example 3: Multiple Sections

```jsx
function App() {
  return (
    <BackgroundVideo>
      <section className="hero">Hero Section</section>
      <section className="content">Content Section</section>
      <section className="footer">Footer Section</section>
    </BackgroundVideo>
  );
}
```

## Styling Tips

### Ensuring Content Visibility

If your content has transparency issues:

```css
.your-content {
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
  color: white; /* Ensure text is readable */
}
```

### Parallax Effect

For a subtle parallax effect:

```css
.background-video {
  transform: translate(-50%, -50%) scale(1.1);
}
```

## License

Part of the APICongress project.
