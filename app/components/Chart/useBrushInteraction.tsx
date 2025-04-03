// components/useBrushInteraction.tsx
import { useState } from 'react';
import { BrushMode, BrushSelection } from '@/app/components/types';

interface UseBrushInteractionResult {
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSelection: BrushSelection;
  handleBrushEnd: (selection: BrushSelection) => void;
  resetBrushSelection: () => void;
}

export function useBrushInteraction(
  onDateRangeChange?: (startDate: string, endDate: string, trigger: string) => void,
  onAnnotationStart?: () => void
): UseBrushInteractionResult {
  const [brushMode, setBrushMode] = useState<BrushMode>('disabled');
  const [brushSelection, setBrushSelection] = useState<BrushSelection>({
    startDate: "",
    endDate: "",
    isActive: false
  });

  const handleBrushEnd = (selection: BrushSelection) => {
    setBrushSelection(selection);

    if (brushMode === 'zoom' && selection.startDate && selection.endDate && onDateRangeChange) {

      onDateRangeChange(selection.startDate, selection.endDate, 'brush');
    }

    if (brushMode === 'annotation' && selection.isActive && selection.startDate && selection.endDate && onAnnotationStart) {
      onAnnotationStart();
    }
  };

  const resetBrushSelection = () => {
    setBrushSelection({
      startDate: "",
      endDate: "",
      isActive: false
    });
  };

  return {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection
  };
}