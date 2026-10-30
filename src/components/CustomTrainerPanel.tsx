import React, { useState, useRef } from 'react';
import { CustomClass, CustomPrediction } from '../types';
import { tfService, OpticalSource } from '../services/tfService';

interface CustomTrainerPanelProps {
  opticalSourceGetter: () => OpticalSource | null;
  customPrediction: CustomPrediction | null;
  onTrainingUpdated: () => void;
}

export const CustomTrainerPanel: React.FC<CustomTrainerPanelProps> = ({
  opticalSourceGetter,
  customPrediction,
  onTrainingUpdated,
}) => {
  const [classes, setClasses] = useState<CustomClass[]>([
    { id: 'sock', name: 'TARGET // SOCK ARCHETYPE', sampleCount: 0, color: '#c084fc' },
    { id: 'background', name: 'VOID // BACKGROUND EMPTY', sampleCount: 0, color: '#847D8D' },
    { id: 'custom_item', name: 'SECONDARY // CUSTOM ARTIFACT', sampleCount: 0, color: '#EDE8E1' },
  ]);
  const [newClassName, setNewClassName] = useState('');
  const [isTraining, setIsTraining] = useState<string | null>(null);
  const trainingIntervalRef = useRef<number | null>(null);

  const recordSample = (classId: string) => {
    const source = opticalSourceGetter();
    if (!source) return;

    tfService.addCustomExample(source, classId);

    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, sampleCount: c.sampleCount + 1 } : c
      )
    );
    onTrainingUpdated();
  };

  const startRecording = (classId: string) => {
    setIsTraining(classId);
    recordSample(classId);
    trainingIntervalRef.current = window.setInterval(() => {
      recordSample(classId);
    }, 150);
  };

  const stopRecording = () => {
    setIsTraining(null);
    if (trainingIntervalRef.current !== null) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newId = `class_${Date.now()}`;
    setClasses((prev) => [
      ...prev,
      {
        id: newId,
        name: newClassName.trim().toUpperCase(),
        sampleCount: 0,
        color: '#c084fc',
      },
    ]);
    setNewClassName('');
  };

  const handleClearClass = (classId: string) => {
    tfService.clearCustomClass(classId);
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, sampleCount: 0 } : c))
    );
    onTrainingUpdated();
  };

  const handleDeleteClass = (classId: string) => {
    tfService.clearCustomClass(classId);
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    onTrainingUpdated();
  };

  return (
    <div className="border border-white/[0.08] bg-[#09080f]/90 backdrop-blur-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-baseline justify-between pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D] block">
            TRANSFER LEARNING ENGINE
          </span>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-white uppercase mt-0.5">
            Adaptive Neural Calibration
          </h2>
        </div>
        <span className="font-mono text-[10px] tracking-widest text-[#847D8D]">
          KNN EMBEDDINGS
        </span>
      </div>

      <p className="text-xs text-[#847D8D] tracking-wide mb-6 leading-relaxed">
        Calibrate the network on your physical subject. Maintain optical focus on the item and hold the calibration trigger for 3 seconds.
      </p>

      {/* Active Custom Match Display */}
      {customPrediction && customPrediction.confidence > 0.4 && (
        <div className="mb-6 p-4 border border-purple-500/40 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-purple-400"></span>
            <span className="text-xs uppercase tracking-[0.18em] text-white font-mono">
              IDENTIFIED: {classes.find((c) => c.id === customPrediction.label)?.name || customPrediction.label}
            </span>
          </div>
          <span className="font-mono text-xs text-purple-300 tracking-widest">
            {(customPrediction.confidence * 100).toFixed(1)}% MATCH
          </span>
        </div>
      )}

      {/* Calibration Class List */}
      <div className="space-y-3">
        {classes.map((cls) => {
          const isActive = customPrediction?.label === cls.id && customPrediction.confidence > 0.5;

          return (
            <div
              key={cls.id}
              className={`p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isActive
                  ? 'border-purple-400/80 bg-purple-950/20'
                  : 'border-white/[0.06] bg-white/[0.01]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-1.5 h-1.5 shrink-0"
                  style={{ backgroundColor: cls.color }}
                />
                <div>
                  <h4 className="text-xs font-semibold tracking-[0.15em] text-[#EDE8E1] uppercase font-mono">
                    {cls.name}
                  </h4>
                  <span className="text-[10px] font-mono text-[#847D8D] tracking-widest uppercase">
                    VECTORS MAPPED // {cls.sampleCount} FRAMES
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  onMouseDown={() => startRecording(cls.id)}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={() => startRecording(cls.id)}
                  onTouchEnd={stopRecording}
                  className={`px-4 py-2 text-[10px] font-mono tracking-[0.2em] uppercase select-none transition-all border ${
                    isTraining === cls.id
                      ? 'border-purple-300 bg-purple-600 text-white'
                      : 'border-white/20 hover:border-purple-400 text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {isTraining === cls.id ? 'SAMPLING...' : 'CALIBRATE (HOLD)'}
                </button>

                {cls.sampleCount > 0 && (
                  <button
                    onClick={() => handleClearClass(cls.id)}
                    className="text-[10px] font-mono text-[#847D8D] hover:text-white tracking-widest uppercase px-2 py-1"
                    title="Clear mapped vectors"
                  >
                    RESET
                  </button>
                )}

                {classes.length > 2 && (
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="text-[10px] font-mono text-[#847D8D] hover:text-red-400 tracking-widest uppercase px-2 py-1"
                    title="Remove class"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Archetype Form */}
      <form onSubmit={handleAddClass} className="mt-6 flex gap-3">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="NEW ARCHETYPE IDENTIFIER..."
          className="flex-1 bg-transparent border-b border-white/20 px-3 py-2 text-xs font-mono tracking-widest text-white placeholder-[#847D8D] focus:outline-none focus:border-purple-400 uppercase"
        />
        <button
          type="submit"
          className="px-5 py-2 border border-white/20 hover:border-purple-400 text-white text-[10px] font-mono tracking-[0.2em] uppercase transition-all"
        >
          APPEND
        </button>
      </form>
    </div>
  );
};
