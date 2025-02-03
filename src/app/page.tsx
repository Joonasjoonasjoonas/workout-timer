'use client';

import { useEffect, useState, useRef } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { Step } from '@/types/StepItem';
import { formatTime, isValidTimeFormat } from '@/utils/utils';
import { useAudio } from '@/hooks/useAudio';
import SortableStepItem from '@/components/SortableStepItem';

export default function Page() {
  // Remove unused timeUnit state
  const [currentText, setCurrentText] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownTime, setCountdownTime] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [finishCountdown, setFinishCountdown] = useState(3);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [repeatCount, setRepeatCount] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const timeInputRef = useRef<HTMLInputElement>(null);
  const { playStartBeep, playCountdownBeep } = useAudio(isSoundEnabled);

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

  const convertTimeToSeconds = (timeString: string): number => {
    if (!timeString.includes(':')) return 0;
    const [minutes, seconds] = timeString.split(':').map(num => parseInt(num) || 0);
    return (minutes * 60) + seconds;
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
        setTimeLeft(steps[currentStepIndex + 1].duration.value);
      } else if (currentRepeat < parseInt(repeatCount || '1')) {
        playStartBeep(); // Play beep for new repeat
        setCurrentRepeat(prev => prev + 1);
        setCurrentStepIndex(0);
        setTimeLeft(steps[0].duration.value);
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
    setTimeLeft(steps[0].duration.value);
    playStartBeep();
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

  // Add useEffect to handle wheel event
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('input[type="text"]')) {
        e.preventDefault();
      }
    };

    // Add event listener with passive: false
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Update handleTimeWheel to not call preventDefault
  const handleTimeWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!timeValue || !timeValue.includes(':')) {
      setTimeValue('00:00');
      return;
    }

    const [minutes, seconds] = timeValue.split(':').map(num => parseInt(num) || 0);
    let totalSeconds = (minutes * 60) + seconds;
    
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
    
    const totalSeconds = convertTimeToSeconds(timeValue);
    if (totalSeconds <= 0) return;
    
    const newStep: Step = {
      id: Date.now(),
      type: type,
      text: type === 'text' ? currentText : 'PAUSE',
      duration: {
        value: totalSeconds,
        unit: 'seconds' as const
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
          Description 
       
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Exercise Name or Description (for example: 'Legs', 'Pushups', etc)"
            className="text-input"
          />
          
          <div className="time-input">
            Single exercise or pause duration 
            <input
              ref={timeInputRef}
              type="text"
              value={timeValue}
              onChange={handleTimeChange}
              onWheel={handleTimeWheel}
              placeholder="MM:SS"
              className="number-input"
              pattern="[0-9]{0,2}:[0-9]{0,2}"
            />
          
           
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
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`btn sound-toggle ${!isSoundEnabled ? 'sound-off' : ''}`}
            >
              {isSoundEnabled ? 'Sounds On ' : 'Sounds Off '}
              {isSoundEnabled ? 
                <SpeakerWaveIcon className="w-5 h-5 inline" /> : 
                <SpeakerXMarkIcon className="w-5 h-5 inline" />
              }
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
                        width: `${(timeLeft / steps[currentStepIndex].duration.value) * 100}%`
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