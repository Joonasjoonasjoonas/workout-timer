import { Step } from "@/types/StepItem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { formatTime } from '@/utils/utils';
import { PencilIcon } from '@heroicons/react/24/outline';

interface SortableStepItemProps {
  step: Step;
  index: number;
  removeStep: (id: number) => void;
  editStep: (id: number) => void;
}

function SortableStepItem({ step, index, removeStep, editStep    }: SortableStepItemProps) {
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
      <button onClick={() => editStep(step.id)} className="edit-btn">
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={handleRemoveClick}
        className="remove-btn"
      >
        ×
      </button>
    </div>
  );
}

export default SortableStepItem;