import React, { useState, useEffect, useRef } from 'react';
import './BackgroundVideo.css';

const BackgroundVideo = ({ children, bgMode = 'home' }) => {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const landscapeRef = useRef(null);
  const portraitRef = useRef(null);

  // Handle orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine media src based on mode
  const getMediaSrc = () => {
    switch (bgMode) {
      case 'debate':
        return '/images/APICONGRESS1.gif';
      case 'voting':
      case 'signing':
      case 'champions':
        return '/images/CHAMPIONS.gif';
      case 'home':
      default:
        return '/images/APICONGRESS0.gif';
    }
  };

  const landscapeSrc = process.env.PUBLIC_URL + getMediaSrc();
  const portraitSrc = process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';

  // Preload image assets
  useEffect(() => {
    const landscapeImg = new Image();
    const portraitImg = new Image();
    let loaded = 0;

    const checkLoaded = () => {
      loaded++;
      if (loaded >= 2) setImagesLoaded(true);
    };

    landscapeImg.onload = checkLoaded;
    portraitImg.onload = checkLoaded;

    landscapeImg.src = landscapeSrc;
    portraitImg.src = portraitSrc;

    const timeout = setTimeout(() => setImagesLoaded(true), 1500);
    return () => clearTimeout(timeout);
  }, [bgMode, landscapeSrc, portraitSrc]);

  return (
    <>
      <div className="background-video-container">
        <img
          ref={landscapeRef}
          src={landscapeSrc}
          alt="APICongress Background Media"
          className={`background-video landscape ${!isPortrait ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
        />
        <img
          ref={portraitRef}
          src={portraitSrc}
          alt="APICongress Portrait Media"
          className={`background-video portrait ${isPortrait ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
        />
        {!imagesLoaded && (
          <div className="background-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
      <div className="content-overlay">{children}</div>
    </>
  );
};

export default BackgroundVideo;
