import { useState } from 'react';

interface SaveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveWorkoutModal({ isOpen, onClose, onSave }: SaveWorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');

  const handleSave = () => {
    if (workoutName.trim()) {
      onSave(workoutName);
      setWorkoutName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="save-workout-title">
      <div className="modal">
        <h2 id="save-workout-title">Save Workout</h2>
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Enter workout name"
          className="number-input"
          style={{ marginBottom: '1rem' }}
          aria-label="Workout name"
          required
        />
        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button 
            onClick={onClose}
            className="btn"
            style={{ backgroundColor: '#ff5252' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn"
            style={{ backgroundColor: '#4CAF50' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 