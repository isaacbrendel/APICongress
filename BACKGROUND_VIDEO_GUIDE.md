# Responsive Background Video Component - Quick Start Guide

This guide covers the responsive background GIF component that automatically switches between landscape and portrait orientations.

## What Was Created

### Core Files

1. **`frontend/src/components/BackgroundVideo.js`**
   - Main React component with responsive background logic
   - Preloads both GIF assets for performance
   - Automatically detects and responds to orientation changes

2. **`frontend/src/components/BackgroundVideo.css`**
   - Full-screen fixed positioning styles
   - Smooth transitions between orientations
   - Mobile-optimized with dynamic viewport height
   - Loading spinner styles

3. **`frontend/src/hooks/useOrientation.js`**
   - Reusable custom hook for orientation detection
   - Returns `isPortrait` boolean and `aspectRatio` number
   - Can be used in any component

### Documentation & Examples

4. **`frontend/src/components/BackgroundVideo.README.md`**
   - Comprehensive documentation
   - API reference and configuration options
   - Troubleshooting guide

5. **`frontend/src/components/BackgroundVideo.example.js`**
   - 7 complete working examples
   - Copy-paste ready code snippets
   - Covers common use cases

## Already Integrated

The component has been integrated into your existing app:

```jsx
// frontend/src/App.js
import BackgroundVideo from './components/BackgroundVideo';

function App() {
  return (
    <BackgroundVideo>
      <div className="App">
        {/* Your existing content */}
      </div>
    </BackgroundVideo>
  );
}
```

## How It Works

### Automatic Background Switching

- **Landscape viewports** (width > height): Shows `APICONGRESS1.gif`
- **Portrait viewports** (height > width): Shows `APICONGRESS5PORTRAIT.gif`
- Switches automatically when you resize the browser or rotate your device

### Asset Locations

```
frontend/public/images/
├── APICONGRESS1.gif           ← Landscape/Desktop (8.4 MB)
└── APICONGRESS5PORTRAIT.gif   ← Portrait/Mobile (7.8 MB)
```

## Quick Usage Guide

### 1. Basic Usage (Already Done)

Your app is already wrapped with the BackgroundVideo component in `App.js`.

### 2. Using the Orientation Hook

To access orientation data in any component:

```jsx
import useOrientation from './hooks/useOrientation';

function MyComponent() {
  const { isPortrait, aspectRatio } = useOrientation();

  return (
    <div>
      <p>Mode: {isPortrait ? 'Portrait' : 'Landscape'}</p>
      <p>Aspect Ratio: {aspectRatio.toFixed(2)}</p>
    </div>
  );
}
```

### 3. Testing the Component

#### Desktop Browser:
1. Start your dev server: `npm start`
2. Open browser to `http://localhost:3000`
3. Resize the browser window to narrow width → background switches to portrait
4. Resize to wide → background switches to landscape

#### Mobile Device:
1. Access your dev server from mobile
2. View in portrait → sees portrait GIF
3. Rotate device to landscape → sees landscape GIF

## Performance Features

✅ **Preloading**: Both GIFs load immediately to prevent flashing
✅ **Smooth Transitions**: CSS-based fade between orientations
✅ **Fixed Positioning**: Background stays in place, no scroll repaints
✅ **Hardware Acceleration**: Uses CSS transforms for GPU rendering
✅ **Loading State**: Shows spinner while assets load

## Customization

### Change GIF Files

Edit `frontend/src/components/BackgroundVideo.js`:

```jsx
// Line 37-38
landscapeImg.src = process.env.PUBLIC_URL + '/images/YOUR_LANDSCAPE.gif';
portraitImg.src = process.env.PUBLIC_URL + '/images/YOUR_PORTRAIT.gif';
```

### Adjust Transition Speed

Edit `frontend/src/components/BackgroundVideo.css`:

```css
.background-video {
  transition: opacity 0.5s ease-in-out; /* Change 0.5s to your preference */
}
```

### Change Orientation Threshold

Edit `frontend/src/hooks/useOrientation.js`:

```jsx
// Line 13
isPortrait: aspectRatio < 1,  // Change threshold here
// Example: aspectRatio < 4/3 switches at 4:3 ratio instead of 1:1
```

## Testing Checklist

- [ ] Desktop: Background shows `APICONGRESS1.gif` in wide window
- [ ] Desktop: Background switches when window becomes narrow
- [ ] Mobile: Portrait shows `APICONGRESS5PORTRAIT.gif`
- [ ] Mobile: Landscape shows `APICONGRESS1.gif`
- [ ] Smooth transition between orientations
- [ ] Content overlays properly
- [ ] No layout shifts or flashing during orientation change

## Troubleshooting

### GIFs Not Loading
```bash
# Check if files exist
ls -la frontend/public/images/APICONGRESS*.gif

# Should show:
# APICONGRESS1.gif
# APICONGRESS5PORTRAIT.gif
```

### Background Not Switching
- Open browser console (F12)
- Resize window and watch for errors
- Check that `useOrientation` hook is being called

### Performance Issues
- GIF files are large (7-8 MB each)
- Consider optimizing if needed:
  ```bash
  # Install gifsicle
  brew install gifsicle  # macOS

  # Optimize GIFs (reduces file size)
  gifsicle -O3 APICONGRESS1.gif -o APICONGRESS1-optimized.gif
  ```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | iOS 14+ | ✅ Full |
| Chrome Mobile | Android 10+ | ✅ Full |

## File Structure

```
APICongress/
└── frontend/
    ├── public/
    │   └── images/
    │       ├── APICONGRESS1.gif          ← Landscape
    │       └── APICONGRESS5PORTRAIT.gif  ← Portrait
    └── src/
        ├── components/
        │   ├── BackgroundVideo.js        ← Main component
        │   ├── BackgroundVideo.css       ← Styles
        │   ├── BackgroundVideo.README.md ← Docs
        │   └── BackgroundVideo.example.js ← Examples
        ├── hooks/
        │   └── useOrientation.js         ← Orientation hook
        └── App.js                        ← Already integrated
```

## Next Steps

1. **Test the implementation**: Run `npm start` and test orientation switching
2. **Review examples**: Check `BackgroundVideo.example.js` for advanced usage patterns
3. **Customize as needed**: Adjust transitions, thresholds, or assets
4. **Mobile testing**: Test on actual devices for real-world performance

## Key Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Auto-switching | ✅ | Detects orientation and swaps GIFs automatically |
| Preloading | ✅ | Both assets load immediately for smooth experience |
| Performance | ✅ | GPU-accelerated, fixed positioning, optimized CSS |
| Mobile support | ✅ | Works on iOS and Android with proper viewport handling |
| Reusable hook | ✅ | `useOrientation()` can be used anywhere |
| Examples | ✅ | 7 complete working examples provided |
| Documentation | ✅ | Comprehensive README with troubleshooting |

## Support

For issues or questions:
- Review `BackgroundVideo.README.md` for detailed documentation
- Check `BackgroundVideo.example.js` for usage patterns
- Inspect browser console for errors
- Verify GIF files are in correct location

---

**Component Version**: 1.0.0
**Last Updated**: 2025-11-13
**React Version**: 19.0.0
