import { useState } from 'react';
import { Step } from '@/types/StepItem';

interface LoadWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (steps: Step[]) => void;
}

const exampleWorkout: Step[] = [
  {
    id: 1,
    type: 'exercise',
    text: 'Squats',
    duration: { value: 40, unit: 'seconds' }
  },
  {
    id: 2,
    type: 'pause',
    text: 'PAUSE',
    duration: { value: 20, unit: 'seconds' }
  },
  {
    id: 3,
    type: 'exercise',
    text: 'Burpees',
    duration: { value: 40, unit: 'seconds' }
  },
  {
    id: 4,
    type: 'pause',
    text: 'PAUSE',
    duration: { value: 20, unit: 'seconds' }
  },
  {
    id: 5,
    type: 'exercise',
    text: 'Lunges',
    duration: { value: 40, unit: 'seconds' }
  },
  {
    id: 6,
    type: 'pause',
    text: 'PAUSE',
    duration: { value: 20, unit: 'seconds' }
  },
  {
    id: 7,
    type: 'exercise',
    text: 'Pushups',
    duration: { value: 40, unit: 'seconds' }
  },
  {
    id: 8,
    type: 'pause',
    text: 'PAUSE',
    duration: { value: 60, unit: 'seconds' }
  }
];

export function LoadWorkoutModal({ isOpen, onClose, onLoad }: LoadWorkoutModalProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Record<string, Step[]>>(() => {
    if (typeof window !== 'undefined') {
      const savedWorkouts = localStorage.getItem('savedWorkouts');
      return savedWorkouts ? JSON.parse(savedWorkouts) : {};
    }
    return {};
  });

  const handleLoad = () => {
    if (selectedWorkout === 'example') {
      onLoad(exampleWorkout);
      onClose();
    } else if (selectedWorkout && workouts[selectedWorkout]) {
      onLoad(workouts[selectedWorkout]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Load workout program</h2>
        <div className="workout-list">
          <button
            className={`workout-btn ${selectedWorkout === 'example' ? 'selected' : ''}`}
            onClick={() => setSelectedWorkout('example')}
          >
            Example Program
          </button>
          {Object.keys(workouts).map((name) => (
            <button
              key={name}
              className={`workout-btn ${selectedWorkout === name ? 'selected' : ''}`}
              onClick={() => setSelectedWorkout(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button 
            onClick={onClose}
            className="btn"
            style={{ backgroundColor: '#ff5252' }}
          >
            Cancel
          </button>
          <button
            onClick={handleLoad}
            className={`btn ${!selectedWorkout ? 'disabled' : ''}`}
            disabled={!selectedWorkout}
            style={{ 
              backgroundColor: selectedWorkout ? '#4CAF50' : '#2d4c2f'
            }}
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
} 