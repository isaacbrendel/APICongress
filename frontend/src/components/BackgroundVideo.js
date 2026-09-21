import React, { useState, useEffect, useRef } from 'react';
import './BackgroundVideo.css';

const BackgroundVideo = ({ children, bgMode = 'home' }) => {
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const landscapeRef = useRef(null);
  const portraitRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMediaSrc = () => {
    switch (bgMode) {
      case 'debate':
        return '/images/APICONGRESS1.gif';
      case 'voting':
      case 'signing':
      case 'champions':
      case 'result':
        return '/images/CHAMPIONS.gif';
      case 'home':
      default:
        return '/images/APICONGRESS0.gif';
    }
  };

  const landscapeSrc = `${process.env.PUBLIC_URL || ''}${getMediaSrc()}`;
  const portraitSrc = `${process.env.PUBLIC_URL || ''}/images/APICONGRESS3PORTRAITgif.gif`;

  useEffect(() => {
    setImagesLoaded(false);
    const landscapeImg = new Image();
    const portraitImg = new Image();
    let loaded = 0;

    const checkLoaded = () => {
      loaded += 1;
      if (loaded >= 2) setImagesLoaded(true);
    };

    landscapeImg.onload = checkLoaded;
    portraitImg.onload = checkLoaded;
    landscapeImg.onerror = checkLoaded;
    portraitImg.onerror = checkLoaded;

    landscapeImg.src = landscapeSrc;
    portraitImg.src = portraitSrc;

    const timeout = setTimeout(() => setImagesLoaded(true), 2000);
    return () => clearTimeout(timeout);
  }, [bgMode, landscapeSrc, portraitSrc]);

  return (
    <>
      <div className="background-video-container" aria-hidden="true">
        <img
          ref={landscapeRef}
          src={landscapeSrc}
          alt=""
          className={`background-video landscape ${!isPortrait ? 'active' : ''} ${
            imagesLoaded ? 'loaded' : ''
          }`}
        />
        <img
          ref={portraitRef}
          src={portraitSrc}
          alt=""
          className={`background-video portrait ${isPortrait ? 'active' : ''} ${
            imagesLoaded ? 'loaded' : ''
          }`}
        />
        <div className="background-veil" />
        {!imagesLoaded && (
          <div className="background-loading">
            <div className="loading-spinner" />
          </div>
        )}
      </div>
      <div className="content-overlay">{children}</div>
    </>
  );
};

export default BackgroundVideo;
