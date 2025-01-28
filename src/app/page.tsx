'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Initialize speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log('Voices loaded:', availableVoices);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load

    // Test speech
    const testSpeech = async () => {
      await speak('Timer ready');
    };
    setTimeout(testSpeech, 1000);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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

  const beep = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 200);
  }, []);

  const speak = async (text: string): Promise<void> => {
    console.log('Attempting to speak:', text);
    
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find an English voice
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en-')
        );

        if (englishVoice) {
          console.log('Using voice:', englishVoice.name);
          utterance.voice = englishVoice;
        } else {
          console.log('No English voice found, using default');
        }

        utterance.onstart = () => {
          console.log('Speech started:', text);
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log('Speech ended:', text);
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech error:', event);
          setIsSpeaking(false);
          resolve();
        };

        // Ensure we're not speaking before starting new speech
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        // Small delay before speaking
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 100);
      } else {
        console.log('Speech synthesis not supported');
        resolve();
      }
    });
  };

  const startTimer = useCallback(async (step: Step) => {
    console.log('Starting timer for step:', step);
    setIsActive(false); // Pause timer while speaking

    try {
      // Announce the step
      if (step.type === 'text') {
        await speak(step.text);
      } else {
        await speak('Rest period');
      }

      // Start the countdown
      setIsActive(true);
    } catch (error) {
      console.error('Error in startTimer:', error);
      setIsActive(true); // Ensure timer starts even if speech fails
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0 && !isSpeaking) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 3 && time > 0) {
            beep();
            speak(time.toString());
          }

          if (time <= 1) {
            if (currentStepIndex < steps.length - 1) {
              const nextStep = steps[currentStepIndex + 1];
              setCurrentStepIndex(prev => prev + 1);
              const nextDuration = convertToSeconds(nextStep.duration.value, nextStep.duration.unit);
              startTimer(nextStep);
              return nextDuration;
            } else {
              speak("Workout complete! Great job!");
              setIsActive(false);
              setIsModalOpen(false);
              setCurrentStepIndex(0);
              return 0;
            }
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      window.speechSynthesis?.cancel();
    };
  }, [isActive, timeLeft, currentStepIndex, steps, isSpeaking, beep, startTimer]);

  const startWorkout = async () => {
    if (steps.length === 0) return;
    
    const firstStep = steps[0];
    if (!firstStep) return;
    
    setCurrentStepIndex(0);
    setIsModalOpen(true);
    const initialDuration = convertToSeconds(firstStep.duration.value, firstStep.duration.unit);
    setTimeLeft(initialDuration);
    
    console.log('Starting workout with step:', firstStep);
    await startTimer(firstStep);
  };

  const stopWorkout = () => {
    setIsActive(false);
    setIsModalOpen(false);
    setCurrentStepIndex(0);
    setTimeLeft(0);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => speak("Workout stopped"), 100);
    }
  };

  const addStep = (type: 'text' | 'pause') => {
    const newStep: Step = {
      id: Date.now(),
      type: type,
      text: type === 'text' ? currentText : 'PAUSE',
      duration: {
        value: parseInt(timeValue) || 0,
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
            placeholder="Enter your text..."
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
            <button onClick={() => addStep('text')} className="btn">
              Add Text
            </button>
            <button onClick={() => addStep('pause')} className="btn pause-btn">
              Add Pause
            </button>
          </div>
        </div>

        {steps.length > 0 && (
          <button 
            onClick={startWorkout}
            className="start-btn"
          >
            Start Workout
          </button>
        )}

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

        {isModalOpen && steps[currentStepIndex] && (
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