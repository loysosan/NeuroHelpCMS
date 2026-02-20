import React, { useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  values,
  onChange,
  label,
  formatValue = (v) => v.toString(),
  className = '',
}) => {
  const [minVal, maxVal] = values;
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  const getPercent = (value: number) =>
    ((value - min) / (max - min)) * 100;

  const handleMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(thumb);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !rangeRef.current) return;

    const rect = rangeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawValue = min + (percent / 100) * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const value = Math.max(min, Math.min(max, steppedValue));

    if (isDragging === 'min' && value <= maxVal) {
      onChange([value, maxVal]);
    } else if (isDragging === 'max' && value >= minVal) {
      onChange([minVal, value]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, minVal, maxVal]);

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase text-gray-500">
            {label}
          </label>
          <span className="text-sm font-medium text-gray-700">
            {formatValue(minVal)} — {formatValue(maxVal)}
          </span>
        </div>
      )}

      <div className="relative pt-2 pb-6">
        {/* Track background */}
        <div
          ref={rangeRef}
          className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer"
        >
          {/* Active range */}
          <div
            className="absolute h-full bg-indigo-600 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Min thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full shadow-md cursor-grab hover:scale-110 transition-transform ${
              isDragging === 'min' ? 'scale-110 cursor-grabbing' : ''
            }`}
            style={{ left: `${minPercent}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={handleMouseDown('min')}
          />

          {/* Max thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full shadow-md cursor-grab hover:scale-110 transition-transform ${
              isDragging === 'max' ? 'scale-110 cursor-grabbing' : ''
            }`}
            style={{ left: `${maxPercent}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={handleMouseDown('max')}
          />
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
