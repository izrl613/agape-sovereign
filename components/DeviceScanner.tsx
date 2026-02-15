
import React, { useState } from 'react';
import { Smartphone, Laptop, ScanLine } from 'lucide-react';

const DeviceScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setScanComplete(false);
    // Add logic to scan mobile and desktop devices
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Device Scanner</h1>
      <p className="text-slate-400">Scan your devices for security vulnerabilities.</p>
      <div className="grid grid-cols-2 gap-8">
        <div className="p-8 bg-gray-800/50 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Smartphone size={64} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Mobile</h2>
          </div>
        </div>
        <div className="p-8 bg-gray-800/50 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Laptop size={64} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Desktop</h2>
          </div>
        </div>
      </div>
      <button
        className={`w-full p-8 bg-purple-600/10 text-purple-400 border border-purple-500/30 rounded-3xl flex items-center justify-center space-x-4 ${scanning ? 'cursor-not-allowed' : ''}`}
        onClick={handleScan}
        disabled={scanning}
      >
        {scanning ? (
          <>
            <ScanLine size={48} className="animate-pulse" />
            <span className="text-2xl font-black uppercase tracking-tighter">Scanning...</span>
          </>
        ) : (
          <>
            <ScanLine size={48} />
            <span className="text-2xl font-black uppercase tracking-tighter">Scan Devices</span>
          </>
        )}
      </button>
      {scanComplete && (
        <div className="text-center text-green-400 font-bold text-xl">
          Scan Complete! No vulnerabilities found.
        </div>
      )}
    </div>
  );
};

export default DeviceScanner;
