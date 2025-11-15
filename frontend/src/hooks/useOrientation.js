// src/hooks/useOrientation.js
import { useState, useEffect } from 'react';

/**
 * Custom hook to detect viewport orientation
 * @returns {Object} { isPortrait: boolean, aspectRatio: number }
 */
const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    isPortrait: false,
    aspectRatio: 1,
  });

  useEffect(() => {
    const updateOrientation = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setOrientation({
        isPortrait: aspectRatio < 1,
        aspectRatio: aspectRatio,
      });
    };

    // Initial check
    updateOrientation();

    // Listen for resize events
    window.addEventListener('resize', updateOrientation);

    // Listen for orientation change events (mobile)
    window.addEventListener('orientationchange', updateOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};

export default useOrientation;
