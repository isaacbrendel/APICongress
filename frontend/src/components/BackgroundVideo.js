import React, { useState, useEffect, useRef } from 'react';
import './BackgroundVideo.css';

const BackgroundVideo = ({ children, isDebateScreen = false }) => {
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

  // Preload images
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

    landscapeImg.src = process.env.PUBLIC_URL + (isDebateScreen ? '/images/APICONGRESS0.gif' : '/images/APICONGRESS1.gif');
    portraitImg.src = process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';

    const timeout = setTimeout(() => setImagesLoaded(true), 2000);
    return () => clearTimeout(timeout);
  }, [isDebateScreen]);

  const landscapeSrc = process.env.PUBLIC_URL + (isDebateScreen ? '/images/APICONGRESS0.gif' : '/images/APICONGRESS1.gif');
  const portraitSrc = process.env.PUBLIC_URL + '/images/APICONGRESS3PORTRAITgif.gif';

  return (
    <>
      <div className="background-video-container">
        <img
          ref={landscapeRef}
          src={landscapeSrc}
          alt=""
          className={`background-video landscape ${!isPortrait ? 'active' : ''} ${imagesLoaded ? 'loaded' : ''}`}
        />
        <img
          ref={portraitRef}
          src={portraitSrc}
          alt=""
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
