'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Install HR Management System</h3>
            <p className="text-sm opacity-90">Install our app for a better experience</p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setShowInstall(false)}
              className="text-white hover:bg-blue-700 px-2 py-1 rounded text-sm"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-1 rounded text-sm font-semibold"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
