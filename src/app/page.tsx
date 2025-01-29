'use client';

import { useEffect, useState } from 'react';
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
    e.stopPropagation(); // Prevent drag event from firing
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
        <p className="step-duration">
          {step.duration.value} {step.duration.unit}
        </p>
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

export default function Page() {
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

  // Add audio context and single beep function at the top of the component
  const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

  const playStartBeep = () => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000; // Gentle pitch
    gainNode.gain.value = 0.1; // Low volume
    
    oscillator.start();
    
    // Long gentle beep
    setTimeout(() => {
      oscillator.stop();
    }, 400); // 400ms duration
  };

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
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
  }, [isActive, timeLeft, currentStepIndex, steps, currentRepeat, repeatCount]);

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
    
    // Only clear text if it's a pause step
    if (type === 'pause') {
      setCurrentText('');
    }
    // Keep timeValue and timeUnit as they are
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
              type="number"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              placeholder="Duration of Exercise"
              className="number-input"
              min="1"
            />
            <select 
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as 'seconds' | 'minutes')}
              className="select-input"
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
            </select>
            <input
              type="number"
              value={repeatCount}
              onChange={(e) => setRepeatCount(e.target.value)}
              placeholder="Complete Rounds"
              min="1"
              className="number-input"
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
              onClick={startExercise}
              className={`start-btn ${steps.length === 0 ? 'disabled' : ''}`}
              disabled={steps.length === 0}
            >
              Start Exercise
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