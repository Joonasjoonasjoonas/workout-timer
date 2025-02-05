import { useState, useEffect } from 'react';
import { Step } from '@/types/StepItem';
import { TrashIcon } from '@heroicons/react/24/outline';

interface LoadWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (steps: Step[]) => void;
  workouts: Record<string, Step[]>;
  setWorkouts: (workouts: Record<string, Step[]>) => void;
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

export function LoadWorkoutModal({ isOpen, onClose, onLoad, workouts, setWorkouts }: LoadWorkoutModalProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedWorkout(null);
      setIsDeleteMode(false);
    }
  }, [isOpen]);

  const handleLoad = () => {
    if (selectedWorkout === 'example') {
      onLoad(exampleWorkout);
      onClose();
    } else if (selectedWorkout && workouts[selectedWorkout]) {
      onLoad(workouts[selectedWorkout]);
      onClose();
    }
  };

  const handleDelete = () => {
    if (selectedWorkout && selectedWorkout !== 'example') {
      const updatedWorkouts = { ...workouts };
      delete updatedWorkouts[selectedWorkout];
      setWorkouts(updatedWorkouts);
      localStorage.setItem('savedWorkouts', JSON.stringify(updatedWorkouts));
      setSelectedWorkout(null);
      setIsDeleteMode(false);
    }
  };

  const handleDeleteClick = (name: string) => {
    setSelectedWorkout(name);
    setIsDeleteMode(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        {!isDeleteMode ? (
          <>
            <h2>Load workout</h2>
            <div className="workout-list">
              <button
                className={`workout-btn ${selectedWorkout === 'example' ? 'selected' : ''}`}
                onClick={() => setSelectedWorkout('example')}
              >
                Example Program
              </button>
              {Object.keys(workouts).map((name) => (
                <div key={name} className="workout-item">
                  <div 
                    className={`workout-btn-container ${selectedWorkout === name ? 'selected' : ''}`}
                    onClick={() => setSelectedWorkout(name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Load workout: ${name}, contains ${workouts[name].length} exercises`}
                  >
                    <span className="workout-name">{name}</span>
                     <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(name);
                    }}
                    className="delete-btn"
                    aria-label={`Delete ${name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  </div>
                 
                </div>
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
                className="btn"
                style={{ backgroundColor: '#4CAF50' }}
              >
                Load
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Remove workout</h2>
            <p className="delete-message">Are you sure you want to remove &quot;{selectedWorkout}&quot;?</p>
            <div className="button-group" style={{ marginTop: '1rem' }}>
              <button 
                onClick={() => setIsDeleteMode(false)}
                className="btn"
                style={{ backgroundColor: '#ff5252' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn"
                style={{ backgroundColor: '#4CAF50' }}
              >
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 