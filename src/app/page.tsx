'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Step {
  id: number;
  type: 'text' | 'pause';
  text: string;
  duration: {
    value: number;
    unit: 'seconds' | 'minutes' ;
  };
}

interface SortableStepItemProps {
  step: Step;
  index: number;
  removeStep: (id: number) => void;
}

// Move utility functions outside the component
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function SortableStepItem({ step, index, removeStep }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeStep(step.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`step-item ${step.type === 'pause' ? 'pause' : ''}`}
    >
      <div {...attributes} {...listeners} className="step-content">
        <span className="step-number">{index + 1}</span>
        <p className="step-text">{step.text}</p>
        <p className="step-duration">{formatTime(step.duration.value)}</p>
      </div>
      <button
        onClick={handleRemoveClick}
        className="remove-btn"
      >
        ×
      </button>
    </div>
  );
}

// Create a single AudioContext instance outside the component
let audioCtx: AudioContext | null = null;

// Helper to get or create AudioContext
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export default function Page() {
  // Remove the audioContext declaration from component
  
  const isValidTimeFormat = (value: string): boolean => {
    if (value === '') return true;
    return /^\d{0,2}(:\d{0,2})?$/.test(value);
  };

  const convertTimeToSeconds = (timeString: string): number => {
    if (!timeString.includes(':')) return 0;
    const [minutes, seconds] = timeString.split(':').map(num => parseInt(num) || 0);
    return (minutes * 60) + seconds;
  };

  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const playStartBeep = () => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, 400);
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  const playCountdownBeep = () => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  // Clean up AudioContext when component unmounts
  useEffect(() => {
    return () => {
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
      }
    };
  }, []);

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes' >('seconds');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownTime, setCountdownTime] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [finishCountdown, setFinishCountdown] = useState(3);
  const [repeatCount, setRepeatCount] = useState('');
  const [currentRepeat, setCurrentRepeat] = useState(1);

  // Load steps from localStorage on initial render
  useEffect(() => {
    const savedSteps = localStorage.getItem('exerciseSteps');
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
    localStorage.setItem('exerciseSteps', JSON.stringify(steps));
  }, [steps]);

  const convertToSeconds = (value: number, unit: 'seconds' | 'minutes') => {
    switch (unit) {
      case 'minutes':
        return value * 60;
      default:
        return value;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        // Play countdown beep in last 3 seconds
        if (timeLeft <= 4) {
          playCountdownBeep();
        }
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (currentStepIndex < steps.length - 1) {
        playStartBeep(); // Play beep for new step
        setCurrentStepIndex((index) => index + 1);
        setTimeLeft(
          convertToSeconds(
            steps[currentStepIndex + 1].duration.value,
            steps[currentStepIndex + 1].duration.unit
          )
        );
      } else if (currentRepeat < parseInt(repeatCount || '1')) {
        playStartBeep(); // Play beep for new repeat
        setCurrentRepeat(prev => prev + 1);
        setCurrentStepIndex(0);
        setTimeLeft(
          convertToSeconds(
            steps[0].duration.value,
            steps[0].duration.unit
          )
        );
      } else {
        // Workout is complete
        setIsActive(false);
        setIsFinished(true);
        setFinishCountdown(3);
        
        // Start the finish countdown
        const finishInterval = setInterval(() => {
          setFinishCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(finishInterval);
              stopExercise();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, currentStepIndex, steps, currentRepeat, repeatCount, playStartBeep]);

  const startExercise = () => {
    if (steps.length === 0) return;
    
    setIsModalOpen(true);
    setIsCountingDown(true);
    setCountdownTime(3);
    setCurrentRepeat(1);

    // Start the 3-second countdown
    const countdownInterval = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          startExerciseTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExerciseTimer = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setTimeLeft(
      convertToSeconds(
        steps[0].duration.value,
        steps[0].duration.unit
      )
    );
    playStartBeep(); // Play beep at start
  };

  const stopExercise = () => {
    setIsActive(false);
    setIsModalOpen(false);
    setCurrentStepIndex(0);
    setTimeLeft(0);
    setIsFinished(false);
    setFinishCountdown(3);
    setCurrentRepeat(1);
  };

  // Update time input handler
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const prevValue = timeValue;
    
    // Handle backspace
    if (value.length < prevValue.length) {
      // If we're deleting the colon, keep the minutes
      if (prevValue.includes(':') && !value.includes(':')) {
        setTimeValue(prevValue.split(':')[0]);
        return;
      }
      // Allow normal deletion
      setTimeValue(value);
      return;
    }

    if (isValidTimeFormat(value)) {
      if (value.length === 2 && !value.includes(':')) {
        // Add colon after 2 digits for minutes
        setTimeValue(value + ':');
      } else if (value.includes(':')) {
        const [minutes, seconds] = value.split(':');
        
        // If minutes are entered and seconds are empty or just completed
        if (minutes && (!seconds || seconds.length === 2)) {
          if (!seconds) {
            // Auto-add '00' for seconds
            setTimeValue(`${minutes}:00`);
            return;
          }
          
          // Handle seconds > 59
          const mins = parseInt(minutes);
          const secs = parseInt(seconds);
          if (secs > 59) {
            setTimeValue(`${(mins + 1).toString().padStart(2, '0')}:00`);
            return;
          }
        }
        
        setTimeValue(value);
      } else {
        setTimeValue(value);
      }
    }
  };

  // Add wheel handler
  const handleTimeWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent page scroll
    
    if (!timeValue || !timeValue.includes(':')) {
      setTimeValue('00:00');
      return;
    }

    const [minutes, seconds] = timeValue.split(':').map(num => parseInt(num) || 0);
    let totalSeconds = (minutes * 60) + seconds;
    
    // Decrease time on scroll up, increase on scroll down
    if (e.deltaY < 0) {
      totalSeconds += 1;
    } else {
      totalSeconds = Math.max(0, totalSeconds - 1);
    }

    const newMinutes = Math.floor(totalSeconds / 60);
    const newSeconds = totalSeconds % 60;
    
    setTimeValue(
      `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
    );
  };

  // Update addStep function
  const addStep = (type: 'text' | 'pause') => {
    if (!timeValue || timeValue === ':') return;
    
    const seconds = convertTimeToSeconds(timeValue);
    if (seconds <= 0) return;
    
    const newStep = {
      id: Date.now(),
      type: type,
      text: type === 'text' ? currentText : 'PAUSE',
      duration: {
        value: seconds,
        unit: 'seconds'
      }
    };
    setSteps([...steps, newStep]);
    
    if (type === 'pause') {
      setCurrentText('');
    }
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Workout Timer</h1>
        
        <div className="input-section">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Exercise Name or Description (for example: 'Legs', 'Pushups', etc)"
            className="text-input"
          />
          
          <div className="time-input">
            <input
              type="text"
              value={timeValue}
              onChange={handleTimeChange}
              onWheel={handleTimeWheel}
              placeholder="MM:SS"
              className="number-input"
              pattern="[0-9]{0,2}:[0-9]{0,2}"
            />
            <input
              type="number"
              value={repeatCount}
              onChange={(e) => setRepeatCount(e.target.value)}
              placeholder="Repeat amount"
              min="1"
              className="number-input"
            />
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`number-input sound-toggle ${!isSoundEnabled ? 'sound-off' : ''}`}
            >
              {isSoundEnabled ? 'Sounds On' : 'Sounds Off'} 🔈
            </button>
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
              onClick={startExercise}
              className={`start-btn ${steps.length === 0 ? 'disabled' : ''}`}
              disabled={steps.length === 0}
            >
              Start Workout
            </button>
          </div>
         
        </div>

        <DndContext
         sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map(step => step.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="steps-list">
              {steps.map((step, index) => (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  removeStep={removeStep}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              {isCountingDown ? (
                <>
                  <h2>Get Ready!</h2>
                  <div className="timer">{countdownTime}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress counting" 
                      style={{ 
                        width: `${(countdownTime / 3) * 100}%`
                      }}
                    />
                  </div>
                </>
              ) : isFinished ? (
                <>
                  <h2>Done!</h2>
                  <div className="timer">{finishCountdown}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress counting" 
                      style={{ 
                        width: `${(finishCountdown / 3) * 100}%`
                      }}
                    />
                  </div>
                </>
              ) : currentStepIndex < steps.length && (
                <>
                  <h2>
                    {steps[currentStepIndex].text}
                    {parseInt(repeatCount) > 1 && ` (${currentRepeat}/${repeatCount})`}
                  </h2>
                  <div className="timer">{formatTime(timeLeft)}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress counting"
                      style={{ 
                        width: `${(timeLeft / convertToSeconds(
                          steps[currentStepIndex].duration.value,
                          steps[currentStepIndex].duration.unit
                        )) * 100}%`
                      }}
                    />
                  </div>
                </>
              )}
              <button onClick={stopExercise} className="stop-btn">
                Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 