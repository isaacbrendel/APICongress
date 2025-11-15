// src/components/BackgroundVideo.js
import React, { useState, useEffect, useRef } from 'react';
import useOrientation from '../hooks/useOrientation';
import './BackgroundVideo.css';

const BackgroundVideo = ({ children, isDebateScreen = false }) => {
  const { isPortrait } = useOrientation();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const landscapeRef = useRef(null);
  const portraitRef = useRef(null);

  // Preload images
  useEffect(() => {
    const landscapeImg = new Image();
    const portraitImg = new Image();

    let landscapeLoaded = false;
    let portraitLoaded = false;

    const checkAllLoaded = () => {
      if (landscapeLoaded && portraitLoaded) {
        setImagesLoaded(true);
      }
    };

    landscapeImg.onload = () => {
      landscapeLoaded = true;
      checkAllLoaded();
    };

    portraitImg.onload = () => {
      portraitLoaded = true;
      checkAllLoaded();
    };

    // Choose images based on screen type
    if (isDebateScreen) {
      // Debate screen: static frame from gif
      landscapeImg.src = process.env.PUBLIC_URL + '/images/APICONGRESS0.gif';
      portraitImg.src = process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';
    } else {
      // Home screen: animated GIFs for both orientations
      landscapeImg.src = process.env.PUBLIC_URL + '/images/APICONGRESS1.gif';
      portraitImg.src = process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';
    }

    // Fallback timeout in case images don't load
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isDebateScreen]);

  // Get appropriate image sources
  const getLandscapeSrc = () => {
    if (isDebateScreen) {
      // Use static frame from gif for debate screen
      return process.env.PUBLIC_URL + '/images/APICONGRESS0.gif';
    }
    return process.env.PUBLIC_URL + '/images/APICONGRESS1.gif';
  };

  const getPortraitSrc = () => {
    // For both home and debate screens on mobile, use static frame
    // User wants one static frame from portrait gif for mobile
    return process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';
  };

  return (
    <>
      <div className="background-video-container">
        {/* Landscape/Desktop Background */}
        <img
          ref={landscapeRef}
          src={getLandscapeSrc()}
          alt="Background"
          className={`background-video landscape ${!isPortrait ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
          loading="eager"
        />

        {/* Portrait/Mobile Background */}
        <img
          ref={portraitRef}
          src={getPortraitSrc()}
          alt="Background"
          className={`background-video portrait ${isPortrait ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
          loading="eager"
        />

        {/* Optional loading indicator */}
        {!imagesLoaded && (
          <div className="background-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      {/* Content overlay */}
      <div className="content-overlay">
        {children}
      </div>
    </>
  );
};

export default BackgroundVideo;
