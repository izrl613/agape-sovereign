
import { Info } from 'lucide-react';

const InfoPanel = ({ message }: { message: string }) => {
  return (
    <div className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg relative" role="alert">
      <div className="flex items-center">
        <Info size={24} className="mr-3" />
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
};

export default InfoPanel;
