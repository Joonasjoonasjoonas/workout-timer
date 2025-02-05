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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SpeakerWaveIcon, SpeakerXMarkIcon, TrashIcon} from '@heroicons/react/24/outline';
import { FolderPlusIcon, FolderOpenIcon} from '@heroicons/react/24/solid';
import { Step } from '@/types/StepItem';
import { formatTime } from '@/utils/utils';
import { useAudio } from '@/hooks/useAudio';
import SortableStepItem from '@/components/SortableStepItem';
import { TotalRounds } from '@/components/TotalRounds';
import { SaveWorkoutModal } from '@/components/SaveWorkoutModal';
import { LoadWorkoutModal } from '@/components/LoadWorkoutModal';

export default function Page() {
  // Remove unused timeUnit state
  const [currentText, setCurrentText] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
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
  const [isEditing, setIsEditing] = useState<{ active: boolean; type: 'exercise' | 'pause' | null }>({
    active: false,
    type: null
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<Record<string, Step[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedWorkouts');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showDescriptionError, setShowDescriptionError] = useState(false);
  const [showDurationError, setShowDurationError] = useState(false);
  const [isEmptyWorkoutModalOpen, setIsEmptyWorkoutModalOpen] = useState(false);

  const { playStartBeep, playCountdownBeep } = useAudio(isSoundEnabled);

  // Load steps from localStorage on initial render
  useEffect(() => {
    const savedSteps = localStorage.getItem('exerciseSteps');
    if (savedSteps && savedSteps !== '[]') {
      try {
        setSteps(JSON.parse(savedSteps));
      } catch (error) {
        console.error('Error loading steps from localStorage:', error);
      }
    } else {
      // Create example workout if no saved steps exist
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
      
      setSteps(exampleWorkout);
      localStorage.setItem('exerciseSteps', JSON.stringify(exampleWorkout));
    }
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('input[type="text"]')) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);


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

    if (isActive && timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
  
        if (timeLeft <= 4) {
          playCountdownBeep();
        }
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (currentStepIndex < steps.length - 1) {
        playStartBeep(); 
        setCurrentStepIndex((index) => index + 1);
        setTimeLeft(steps[currentStepIndex + 1].duration.value);
      } else if (currentRepeat < parseInt(repeatCount || '1')) {
        playStartBeep();
        setCurrentRepeat(prev => prev + 1);
        setCurrentStepIndex(0);
        setTimeLeft(steps[0].duration.value);
      } else {
        setIsActive(false);
        setIsFinished(true);
        setFinishCountdown(3);
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
  }, [isActive, timeLeft, currentStepIndex, steps, currentRepeat, repeatCount, playStartBeep, playCountdownBeep, isPaused]);

  const startExercise = () => {
    if (steps.length === 0) return;
    setIsModalOpen(true);
    setIsCountingDown(true);
    setCountdownTime(3);
    setCurrentRepeat(1);
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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    const previousValue = timeValue;
    const isBackspace = previousValue.length > value.length;
    if (isBackspace && previousValue[cursorPosition] === ':') {
      value = previousValue.slice(0, cursorPosition - 1) + previousValue.slice(cursorPosition + 1);
      setTimeValue(value);
      setTimeout(() => {
        if (e.target) {
          e.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
        }
      }, 0);
      return;
    }
    value = value.replace(/[^\d:]/g, '');

    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }

    if (value.length > 5) {
      return;
    }

    const [minutes, seconds] = value.split(':').map(v => v || '');

    if (minutes && parseInt(minutes) > 99) {
      return;
    }
    if (seconds && parseInt(seconds) > 59) {
      return;
    }

    setTimeValue(value);
    setShowDurationError(false);

    if (value.length === 5) {
      const formattedValue = `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
      setTimeValue(formattedValue);
    }
  };

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

  const addOrSaveStep = (type: 'exercise' | 'pause') => {
    let hasError = false;

    if (type === 'exercise' && !currentText.trim()) {
      setShowDescriptionError(true);
      hasError = true;
    }
    
    if (!timeValue) {
      setShowDurationError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const totalSeconds = convertTimeToSeconds(timeValue);
    if (totalSeconds <= 0) return;
    
    const newStep: Step = {
      id: editingId || Date.now(),
      type: type,
      text: type === 'exercise' ? currentText : 'PAUSE',
      duration: {
        value: totalSeconds,
        unit: 'seconds' as const
      }
    };

    if (isEditing.active) {
      setSteps(steps.map(step => step.id === editingId ? newStep : step));
    } else {
      setSteps([...steps, newStep]);
    }
    
    setCurrentText('');
    setTimeValue('');
    setIsEditing({ active: false, type: null });
    setEditingId(null);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const editStep = (id: number) => {
    const stepToEdit = steps.find(step => step.id === id);
    if (stepToEdit) {
      setCurrentText(stepToEdit.type === 'pause' ? 'PAUSE' : stepToEdit.text);
      setTimeValue(formatTime(stepToEdit.duration.value));
      setIsEditing({ active: true, type: stepToEdit.type });
      setEditingId(id);
      setShowDescriptionError(false);
      setShowDurationError(false);
    }
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

  const handleSaveWorkout = (workoutName: string) => {
    const updatedWorkouts = {
      ...savedWorkouts,
      [workoutName]: steps
    };
    setSavedWorkouts(updatedWorkouts);
    localStorage.setItem('savedWorkouts', JSON.stringify(updatedWorkouts));
    setIsSaveModalOpen(false);
  };

  const handleLoadWorkout = (loadedSteps: Step[]) => {
    if (Array.isArray(loadedSteps) && loadedSteps.length > 0) {
      setSteps(loadedSteps);
      setIsLoadModalOpen(false);
    }
  };

  const handleEmptyWorkout = () => {
    setSteps([]);
    setIsEmptyWorkoutModalOpen(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentText(e.target.value);
    setShowDescriptionError(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Handle modals
        if (isModalOpen) {
          setIsModalOpen(false);
          setIsActive(false);
          setIsCountingDown(false);
          setCountdownTime(3);
          setTimeLeft(0);
          setCurrentStepIndex(0);
          setCurrentRepeat('1');
          // Stop any ongoing sounds
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContext.close();
        }
        if (isSaveModalOpen) setIsSaveModalOpen(false);
        if (isLoadModalOpen) setIsLoadModalOpen(false);
        if (isEmptyWorkoutModalOpen) setIsEmptyWorkoutModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isSaveModalOpen, isLoadModalOpen, isEmptyWorkoutModalOpen]);

  useEffect(() => {
    if (isModalOpen || isSaveModalOpen || isLoadModalOpen) {
      // Store the last focused element
      const lastFocus = document.activeElement;
      
      // Focus the first focusable element in the modal
      const modal = document.querySelector('[role="dialog"]');
      const firstFocusable = modal?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
      }

      return () => {
        // Restore focus when modal closes
        if (lastFocus instanceof HTMLElement) {
          lastFocus.focus();
        }
      };
    }
  }, [isModalOpen, isSaveModalOpen, isLoadModalOpen]);

  return (
    <main className="container">
      <header>
        <h1>Workout Timer</h1>
        <meta name="description" content="Create and time your custom workout routines" />
      </header>
      <section aria-label="Workout creation">
        <div className="input-section">
       
          
          {!isEditing.active || (isEditing.active && isEditing.type === 'exercise') ? (
            <div className="input-group">
                 <div className="input-section-top">
            <span>Description</span>
            <div className="input-section-top-buttons">
              <button onClick={() => setIsSaveModalOpen(true)}>
                <FolderPlusIcon className="icon-button w-4 h-4" />
              </button>
              <button onClick={() => setIsLoadModalOpen(true)}><FolderOpenIcon className="icon-button w-4 h-4" /></button>
              <button
                onClick={() => setIsEmptyWorkoutModalOpen(true)}
                className="icon-button"
              >
                <TrashIcon className="icon-button-delete w-4 h-4" />
              </button>
            </div>
          </div>
              <input
                type="text"
                value={currentText}
                onChange={handleTextChange}
                placeholder="Description for a single exercise routine (for example: 'Legs', 'Pushups', etc)"
                className={`text-input ${showDescriptionError ? 'error' : ''}`}
                aria-label="Exercise description"
                aria-invalid={showDescriptionError}
                aria-describedby={showDescriptionError ? "description-error" : undefined}
                disabled={isEditing.active && isEditing.type === 'pause'}
              />
              {showDescriptionError ? (
                <span className="error-message" id="description-error" role="alert">Description is required</span>
              ) : (
                <span className="error-message"></span>
              )}
            </div>
          ) : (
            <div className="input-group">
              <input
                type="text"
                value="PAUSE"
                disabled
                className="text-input"
                aria-label="Pause"
              />
              <span className="error-message"></span>
            </div>
          )}
          
          <div className="input-group">
            <span>Duration</span>
            <input
              type="text"
              value={timeValue}
              onChange={handleTimeChange}
              onWheel={handleTimeWheel}
              placeholder="MM:SS"
              className={`number-input ${showDurationError ? 'error' : ''}`}
              pattern="[0-9]{0,2}:[0-9]{0,2}"
            />
            {showDurationError ? (
              <span className="error-message" id="description-error" role="alert">Duration is required</span>
            ) : (
              <span className="error-message"></span>
            )}
          </div>

          <div className="button-group">
            <button 
              onClick={() => addOrSaveStep('exercise')} 
              className={`btn ${isEditing.active && isEditing.type === 'pause' ? 'disabled' : ''}`}
              aria-label={isEditing.active && isEditing.type === 'exercise' ? 'Save exercise' : 'Add exercise'}
              disabled={isEditing.active && isEditing.type === 'pause'}
            >
              {isEditing.active && isEditing.type === 'exercise' ? 'Save Exercise' : 'Add Exercise'}
            </button>
            <button 
              onClick={() => addOrSaveStep('pause')} 
              className={`btn pause-btn ${isEditing.active && isEditing.type === 'exercise' ? 'editing' : ''}`}
              aria-label={isEditing.active && isEditing.type === 'pause' ? 'Save pause' : 'Add pause'}
              disabled={isEditing.active && isEditing.type === 'exercise'}
            >
              {isEditing.active && isEditing.type === 'pause' ? 'Save Pause' : 'Add Pause'}
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
              className={`start-btn ${steps.length === 0 || isEditing.active ? 'disabled' : ''}`}
              disabled={steps.length === 0 || isEditing.active}
            >
              Start Workout
            </button>
          </div>
        </div>
      </section>
      <section aria-label="Workout steps">
        <div className="workout-section">
          <div className={`steps-container ${isEditing.active ? 'editing-active' : ''}`}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={steps.map(step => step.id)} strategy={verticalListSortingStrategy}>
                {steps.map((step, index) => (
                  <SortableStepItem
                    key={step.id}
                    step={step}
                    index={index}
                    removeStep={removeStep}
                    editStep={editStep}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          
          {steps.length > 0 && (
            <TotalRounds
              repeatCount={repeatCount}
              setRepeatCount={setRepeatCount}
            />
          )}
        </div>
      </section>
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="workout-timer-title">
          <div className="modal">
            {isCountingDown ? (
              <>
                <h2 id="workout-timer-title">Get Ready!</h2>
                <div className="timer" role="timer" aria-live="assertive">
                  {countdownTime}
                </div>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  aria-valuemin="0" 
                  aria-valuemax="3" 
                  aria-valuenow={countdownTime}
                >
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
                <div className="button-group">
                  <button onClick={stopExercise} className="btn" style={{ backgroundColor: '#ff5252' }}>
                    Stop
                  </button>
                  <button 
                    onClick={handlePauseResume} 
                    className="btn"
                    style={{ backgroundColor: '#FF9800' }}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <SaveWorkoutModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveWorkout}
      />
      <LoadWorkoutModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={handleLoadWorkout}
        workouts={savedWorkouts}
        setWorkouts={setSavedWorkouts}
      />
      <div className="modal-overlay" style={{ display: isEmptyWorkoutModalOpen ? 'flex' : 'none' }}>
        <div className="modal">
          <h2>Delete workout</h2>
          <p style={{ margin: '1rem 0', textAlign: 'center' , color: '#ff5252'}}>
            Are you sure you want to delete the workout program?
          </p>
          <div className="button-group">
            <button 
              onClick={() => setIsEmptyWorkoutModalOpen(false)}
              className="btn"
              style={{ backgroundColor: '#ff5252' }}
            >
              Cancel
            </button>
            <button
              onClick={handleEmptyWorkout}
              className="btn"
              style={{ backgroundColor: '#4CAF50' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      {isActive && (
        <div 
          role="status" 
          aria-live="polite" 
          className="visually-hidden"
        >
          {`Current exercise: ${steps[currentStepIndex].text}, Time remaining: ${formatTime(timeLeft)}`}
        </div>
      )}
  
    </main>
  );
} 