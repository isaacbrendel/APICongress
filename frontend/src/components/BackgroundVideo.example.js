// src/components/BackgroundVideo.example.js
// This file contains examples of how to use the BackgroundVideo component
// You can copy these examples into your own components

import React from 'react';
import BackgroundVideo from './BackgroundVideo';
import useOrientation from '../hooks/useOrientation';

// ============================================
// EXAMPLE 1: Basic Full-Screen Background
// ============================================
export function Example1_BasicUsage() {
  return (
    <BackgroundVideo>
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        <h1>Welcome to API Congress</h1>
        <p>This content is overlaid on the responsive background</p>
      </div>
    </BackgroundVideo>
  );
}

// ============================================
// EXAMPLE 2: Multiple Sections with Background
// ============================================
export function Example2_MultipleSections() {
  return (
    <BackgroundVideo>
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>
          <h1>Hero Section</h1>
          <button>Get Started</button>
        </div>
      </section>

      <section style={{
        minHeight: '100vh',
        padding: '50px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white'
      }}>
        <h2>Content Section</h2>
        <p>This section has a semi-transparent overlay</p>
      </section>

      <footer style={{
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        textAlign: 'center'
      }}>
        <p>Footer Content</p>
      </footer>
    </BackgroundVideo>
  );
}

// ============================================
// EXAMPLE 3: Conditional Background
// ============================================
export function Example3_ConditionalBackground() {
  const [showBackground, setShowBackground] = React.useState(true);

  return (
    <>
      <button
        onClick={() => setShowBackground(!showBackground)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          cursor: 'pointer'
        }}
      >
        Toggle Background
      </button>

      {showBackground ? (
        <BackgroundVideo>
          <div style={{ padding: '100px 20px', color: 'white', textAlign: 'center' }}>
            <h1>Background is ON</h1>
            <p>Click the button to toggle</p>
          </div>
        </BackgroundVideo>
      ) : (
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h1>Background is OFF</h1>
          <p>Click the button to toggle</p>
        </div>
      )}
    </>
  );
}

// ============================================
// EXAMPLE 4: Using the Orientation Hook
// ============================================
export function Example4_OrientationInfo() {
  const { isPortrait, aspectRatio } = useOrientation();

  return (
    <BackgroundVideo>
      <div style={{
        padding: '50px',
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        margin: '50px auto',
        maxWidth: '600px',
        borderRadius: '10px'
      }}>
        <h2>Orientation Info</h2>
        <p style={{ fontSize: '24px', marginBottom: '10px' }}>
          Current Mode: <strong>{isPortrait ? 'Portrait' : 'Landscape'}</strong>
        </p>
        <p style={{ fontSize: '18px' }}>
          Aspect Ratio: {aspectRatio.toFixed(2)}
        </p>
        <p style={{ fontSize: '14px', marginTop: '20px' }}>
          Try rotating your device or resizing your browser window!
        </p>
      </div>
    </BackgroundVideo>
  );
}

// ============================================
// EXAMPLE 5: Card Layout Over Background
// ============================================
export function Example5_CardLayout() {
  const cards = [
    { id: 1, title: 'Card 1', content: 'This is card 1' },
    { id: 2, title: 'Card 2', content: 'This is card 2' },
    { id: 3, title: 'Card 3', content: 'This is card 3' },
  ];

  return (
    <BackgroundVideo>
      <div style={{
        padding: '50px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {cards.map(card => (
          <div key={card.id} style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}>
            <h3>{card.title}</h3>
            <p>{card.content}</p>
          </div>
        ))}
      </div>
    </BackgroundVideo>
  );
}

// ============================================
// EXAMPLE 6: Form with Background
// ============================================
export function Example6_FormLayout() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted!');
  };

  return (
    <BackgroundVideo>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '10px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Sign Up</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input
              type="email"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <button type="submit" style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            Submit
          </button>
        </form>
      </div>
    </BackgroundVideo>
  );
}

// ============================================
// EXAMPLE 7: Scrollable Content with Background
// ============================================
export function Example7_ScrollableContent() {
  return (
    <BackgroundVideo>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '50px 20px',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '48px',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
        }}>
          Long Scrollable Content
        </h1>

        {[1, 2, 3, 4, 5].map(section => (
          <section key={section} style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '40px',
            marginBottom: '30px',
            borderRadius: '10px'
          }}>
            <h2>Section {section}</h2>
            <p style={{ lineHeight: '1.8' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
            <p style={{ lineHeight: '1.8' }}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.
            </p>
          </section>
        ))}
      </div>
    </BackgroundVideo>
  );
}

// ============================================
// HOW TO USE THESE EXAMPLES
// ============================================
/*

1. Import any example into your App.js or other component:

   import { Example1_BasicUsage } from './components/BackgroundVideo.example';

   function App() {
     return <Example1_BasicUsage />;
   }

2. Or use the BackgroundVideo component directly:

   import BackgroundVideo from './components/BackgroundVideo';

   function MyComponent() {
     return (
       <BackgroundVideo>
         <YourContent />
       </BackgroundVideo>
     );
   }

3. Access orientation data in any component:

   import useOrientation from './hooks/useOrientation';

   function MyComponent() {
     const { isPortrait, aspectRatio } = useOrientation();
     // Use the orientation data...
   }

*/
