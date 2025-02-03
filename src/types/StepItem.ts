export interface Step {
  id: number;
  type: 'exercise' | 'pause';
  text: string;
  duration: {
    value: number;
    unit: 'seconds' | 'minutes' ;
  };
}

