'use client';

import { useState } from 'react';

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
        <h1>Sequence Builder</h1>
        
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
      </div>
    </div>
  );
} 