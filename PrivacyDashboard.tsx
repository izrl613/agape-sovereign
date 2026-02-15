
import React, { useState } from 'react';

const services = [
  { name: 'Firefox Monitor', logo: 'https://cdn.worldvectorlogo.com/logos/firefox-monitor.svg' },
  { name: 'SayMine', logo: 'https://images.g2crowd.com/uploads/product/image/large_detail/large_detail_d47a73e7c251d8d3d9195c521542f4b3/saymine.png' },
  { name: 'Jumbo', logo: 'https://jumboprivacy.com/images/jumbo-logomark.svg' },
  { name: 'Unroll.me', logo: 'https://assets-global.website-files.com/5f69085d8521360c88b25916/5f69085d85213628eab2594a_Unroll.Me_Wordmark_Logo_Oatmeal.svg' },
  { name: 'Optery', logo: 'https://www.optery.com/wp-content/uploads/2022/10/optery-logo-and-wordmark-g-g.svg' },
];

const SecurityLevel = ({ level, title, description, onSelect, active }) => (
  <div
    className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
      active ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
    }`}
    onClick={onSelect}
  >
    <h3 className="text-xl font-bold">{`Level ${level}: ${title}`}</h3>
    <p className="text-sm mt-2">{description}</p>
  </div>
);

const PrivacyDashboard = () => {
  const [email, setEmail] = useState('');
  const [socialAccounts, setSocialAccounts] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate a scan
    setTimeout(() => {
      const result = selectedLevel === 5 ? 'NUKED' : 'KNOXED';
      setScanResult(result);
      setIsScanning(false);
    }, 3000);
  };

  if (scanResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className={`text-9xl font-black uppercase tracking-tighter ${scanResult === 'NUKED' ? 'text-red-500' : 'text-green-500'}`}>
          {scanResult}
        </h1>
        <p className="text-2xl text-slate-400 mt-4">Your data has been {scanResult.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">Privacy Dashboard</h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em]">Your Digital Overseer</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Connect Your Accounts</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-4 bg-gray-800 text-white rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              placeholder="Enter your social media profile URLs (one per line)"
              className="w-full p-4 bg-gray-800 text-white rounded-lg h-32"
              value={socialAccounts}
              onChange={(e) => setSocialAccounts(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            {services.map(service => (
              <img src={service.logo} alt={service.name} className="h-8" title={service.name} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Choose Your Security Level</h2>
          <div className="space-y-4">
            <SecurityLevel
              level={1}
              title="Basic Scan"
              description="Check for email breaches and unwanted subscriptions."
              onSelect={() => setSelectedLevel(1)}
              active={selectedLevel === 1}
            />
            <SecurityLevel
              level={2}
              title="Social Media Cleanup"
              description="Analyze social media posts and privacy settings."
              onSelect={() => setSelectedLevel(2)}
              active={selectedLevel === 2}
            />
            <SecurityLevel
              level={3}
              title="Data Broker Removal"
              description="Find and request removal from data broker sites."
              onSelect={() => setSelectedLevel(3)}
              active={selectedLevel === 3}
            />
            <SecurityLevel
              level={4}
              title="KNOXED"
              description="A comprehensive privacy lockdown. All of the above, plus more."
              onSelect={() => setSelectedLevel(4)}
              active={selectedLevel === 4}
            />
            <SecurityLevel
              level={5}
              title="NUKED"
              description="The ultimate data self-destruct. Deletes everything possible."
              onSelect={() => setSelectedLevel(5)}
              active={selectedLevel === 5}
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleScan}
          disabled={isScanning || !email}
          className="px-24 py-6 bg-blue-600 text-white rounded-full text-lg font-black uppercase tracking-widest shadow-2xl disabled:opacity-50"
        >
          {isScanning ? 'Scanning...' : `Initiate Level ${selectedLevel} Scan`}
        </button>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
