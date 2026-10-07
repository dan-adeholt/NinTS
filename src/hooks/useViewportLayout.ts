import React, { useLayoutEffect, useState } from 'react';
import { Display } from './useGameLoop';

const setCSSVariable = (name: string, value: string) => document.documentElement.style.setProperty(name, value);

const isStandaloneApp = () => window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Keeps the canvas scaled to fit the main container and exposes viewport measurements
 * as CSS variables, used by the touch controls to avoid notches and browser chrome.
 * Returns the width available on each side of the screen for the touch controls.
 */
const useViewportLayout = (mainContainerRef: React.RefObject<HTMLDivElement>, display: React.RefObject<Display | null>) => {
  const [sideWidth, setSideWidth] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const mainContainer = mainContainerRef.current;
      const canvas = display.current?.element;
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportOffsetTop = viewport?.offsetTop ?? 0;
      const viewportOffsetBottom = window.innerHeight - (viewportOffsetTop + viewportHeight);
      const isStandalone = isStandaloneApp();
      if (viewport) {
        setCSSVariable('--app-height', `${viewportHeight}px`);
        setCSSVariable('--app-width', `${viewportWidth}px`);
      }
      setCSSVariable('--viewport-top', `${Math.max(0, viewportOffsetTop)}px`);
      setCSSVariable('--viewport-bottom', `${Math.max(0, viewportOffsetBottom)}px`);
      setCSSVariable('--touch-top-extra', isStandalone ? '0px' : '24px');
      setCSSVariable('--touch-side-extra-left', isStandalone ? '0px' : '16px');
      setCSSVariable('--touch-side-extra-right', '0px');
      const toolbar = document.querySelector('[data-toolbar="true"]') as HTMLElement | null;
      if (toolbar) {
        setCSSVariable('--toolbar-height', `${toolbar.getBoundingClientRect().height}px`);
      }
      const touchScale = Math.max(0.78, Math.min(1, viewportHeight / 520));
      setCSSVariable('--touch-scale', touchScale.toFixed(3));
      if (mainContainer && canvas) {
        const containerHeight = mainContainer.clientHeight;
        const containerWidth = mainContainer.clientWidth;
        let newScale = containerHeight / canvas.height;
        if (containerHeight > containerWidth) {
          newScale = containerWidth / canvas.width;
        }

        setSideWidth(Math.max(0.15 * containerWidth, (containerWidth - (canvas.width * newScale)) * 0.5));
        canvas.style.transform = `scale(${newScale})`;
      }
    }

    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);

    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    }
  }, [mainContainerRef, display]);

  return sideWidth;
}

export default useViewportLayout;
