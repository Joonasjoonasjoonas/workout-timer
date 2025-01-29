'use client';

import { useEffect, useState } from 'react';

interface Step {
  id: number;
  type: 'text' | 'pause';
  text: string;
  duration: {
    value: number;
    unit: 'seconds' | 'minutes' | 'hours';
  };
}

export default function Page() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Load steps from localStorage on initial render
  useEffect(() => {
    const savedSteps = localStorage.getItem('workoutSteps');
    if (savedSteps) {
      try {
        setSteps(JSON.parse(savedSteps));
      } catch (error) {
        console.error('Error loading steps from localStorage:', error);
      }
    }
  }, []);

  // Save steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('workoutSteps', JSON.stringify(steps));
  }, [steps]);

  const convertToSeconds = (value: number, unit: 'seconds' | 'minutes' | 'hours') => {
    switch (unit) {
      case 'hours':
        return value * 3600;
      case 'minutes':
        return value * 60;
      default:
        return value;
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && steps.length > 0 && currentStepIndex < steps.length) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            if (currentStepIndex < steps.length - 1) {
              const nextIndex = currentStepIndex + 1;
              const nextStep = steps[nextIndex];
              setCurrentStepIndex(nextIndex);
              return convertToSeconds(nextStep.duration.value, nextStep.duration.unit);
            } else {
              // Workout complete
              setIsActive(false);
              setIsModalOpen(false);
              setCurrentStepIndex(0);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, currentStepIndex, steps]);

  const startWorkout = () => {
    if (steps.length === 0) return;
    
    setCurrentStepIndex(0);
    setIsModalOpen(true);
    setIsActive(true);
    
    // Set initial time from first step
    const firstStep = steps[0];
    setTimeLeft(convertToSeconds(firstStep.duration.value, firstStep.duration.unit));
  };

  const stopWorkout = () => {
    setIsActive(false);
    setIsModalOpen(false);
    setCurrentStepIndex(0);
    setTimeLeft(0);
  };

  const addStep = (type: 'text' | 'pause') => {
    if (!timeValue || parseInt(timeValue) <= 0) return;
    
    const newStep = {
      id: Date.now(),
      type: type,
      text: type === 'text' ? currentText : 'PAUSE',
      duration: {
        value: parseInt(timeValue),
        unit: timeUnit
      }
    };
    setSteps([...steps, newStep]);
    setCurrentText('');
    setTimeValue('');
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Workout Timer</h1>
        
        <div className="input-section">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Workout Name or Description (for example: 'Legs', 'Pushups', etc)"
            className="text-input"
          />
          
          <div className="time-input">
            <input
              type="number"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              placeholder="Time"
              className="number-input"
            />
            <select 
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as 'seconds' | 'minutes' | 'hours')}
              className="select-input"
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>

          <div className="button-group">
            <button 
              onClick={() => addStep('text')} 
              className={`btn ${(!currentText || !timeValue) ? 'disabled' : ''}`}
              disabled={!currentText || !timeValue}
            >
              Add Exercise
            </button>
            <button 
              onClick={() => addStep('pause')} 
              className={`btn pause-btn ${!timeValue ? 'disabled' : ''}`}
              disabled={!timeValue}
            >
              Add Pause
            </button>
            <button 
              onClick={startWorkout}
              className={`start-btn ${steps.length === 0 ? 'disabled' : ''}`}
              disabled={steps.length === 0}
            >
              Start Workout
            </button>
          </div>
         
        </div>

        <div className="steps-list">
          {steps.map((step, index) => (
            <div key={step.id} className={`step-item ${step.type}`}>
              <span className="step-number">{index + 1}</span>
              <p className="step-text">{step.text}</p>
              <p className="step-duration">
                {step.duration.value} {step.duration.unit}
              </p>
              <button 
                onClick={() => removeStep(step.id)}
                className="remove-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {isModalOpen && currentStepIndex < steps.length && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>{steps[currentStepIndex].text}</h2>
              <div className="timer">{formatTime(timeLeft)}</div>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ 
                    width: `${(timeLeft / convertToSeconds(
                      steps[currentStepIndex].duration.value,
                      steps[currentStepIndex].duration.unit
                    )) * 100}%`
                  }}
                />
              </div>
              <button onClick={stopWorkout} className="stop-btn">
                Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 