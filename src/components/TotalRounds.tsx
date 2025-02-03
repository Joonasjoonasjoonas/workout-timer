import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface TotalRoundsProps {
  repeatCount: string;
  setRepeatCount: (value: string) => void;
}

export function TotalRounds({ repeatCount, setRepeatCount }: TotalRoundsProps) {
  const handleIncrement = () => {
    const currentValue = parseInt(repeatCount) || 1;
    setRepeatCount((currentValue + 1).toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(repeatCount) || 1;
    if (currentValue > 1) {
      setRepeatCount((currentValue - 1).toString());
    }
  };

  return (
    <div className="total-rounds">
      <div className="total-rounds-controls">
        <button 
          onClick={handleDecrement}
          className="round-btn"
          disabled={parseInt(repeatCount) === 1}
        >
          <MinusIcon className="w-4 h-4" />
        </button>
           <span className="total-rounds-text">Total rounds: {repeatCount || '1'}</span>
        <button 
          onClick={handleIncrement}
          className="round-btn"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 