'use client';

import React, { useMemo } from 'react';
import { StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only create stylesheet once with useMemo to prevent infinite re-renders
  const styleSheet = useMemo(() => {
    if (typeof window === 'undefined') {
      // Server-side: create a new stylesheet
      const { ServerStyleSheet } = require('styled-components');
      return new ServerStyleSheet();
    }
    return null;
  }, []);

  // Client-side: just return children without StyleSheetManager
  if (typeof window !== 'undefined') {
    return <>{children}</>;
  }

  // Server-side: wrap with StyleSheetManager
  return (
    <StyleSheetManager sheet={styleSheet?.instance}>
      {children}
    </StyleSheetManager>
  );
}
