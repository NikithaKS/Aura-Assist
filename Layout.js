import React from 'react';
import EmergencyButton from './components/EmergencyButton';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen">
      {children}
      
      {/* Emergency SOS button - available on all pages */}
      <EmergencyButton />
    </div>
  );
}