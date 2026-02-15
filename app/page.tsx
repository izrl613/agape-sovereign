
import BreachReport from '../components/BreachReport';
import DataBrokerPurge from '../components/DataBrokerPurge';
import DeviceScanner from '../components/DeviceScanner';
import FootprintFinder from '../components/FootprintFinder';
import PrivacyGuardian from '../components/PrivacyGuardian';
import Settings from '../components/Settings';
import SubscriptionCleaner from '../components/SubscriptionCleaner';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="py-16 space-y-16">
        <BreachReport />
        <DataBrokerPurge />
        <FootprintFinder />
        <PrivacyGuardian />
        <SubscriptionCleaner />
        <DeviceScanner />
        <Settings />
      </main>
    </div>
  );
};

export default Home;
