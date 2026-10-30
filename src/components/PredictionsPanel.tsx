import React from 'react';
import { BoundingBoxDetection, ClassificationResult } from '../types';

interface PredictionsPanelProps {
  classifications: ClassificationResult[];
  detections: BoundingBoxDetection[];
  confidenceThreshold: number;
  isLoading: boolean;
}

export const PredictionsPanel: React.FC<PredictionsPanelProps> = ({
  classifications = [],
  detections = [],
  confidenceThreshold,
  isLoading,
}) => {
  const safeClassifications = Array.isArray(classifications) ? classifications : [];
  const safeDetections = Array.isArray(detections) ? detections : [];

  return (
    <div className="flex flex-col gap-6">
      {/* 1,000-Class Spectrum (ImageNet / MobileNet) */}
      <div className="border border-white/[0.08] bg-[#09080f]/90 backdrop-blur-2xl p-6 sm:p-8">
        <div className="flex items-baseline justify-between pb-4 border-b border-white/[0.06] mb-6">
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D] block">
              SPECTRUM ANALYSIS
            </span>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-white uppercase mt-0.5">
              Archetype Classification
            </h2>
          </div>
          <span className="font-mono text-[10px] tracking-widest text-[#847D8D]">
            THRESHOLD // {(confidenceThreshold * 100).toFixed(0)}%
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-5 h-5 border border-purple-400 border-t-transparent animate-spin"></div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#847D8D] uppercase">
              CALCULATING WEIGHT DISTRIBUTION...
            </span>
          </div>
        ) : safeClassifications.length === 0 ? (
          <div className="py-12 text-center text-[#847D8D] text-xs font-mono tracking-widest uppercase">
            Awaiting optical subject in lens focus.
          </div>
        ) : (
          <div className="space-y-4">
            {safeClassifications.map((item, idx) => {
              const className = item?.className || 'UNIDENTIFIED ARTIFACT';
              const isSock = className.toLowerCase().includes('sock');
              const prob = typeof item?.probability === 'number' ? item.probability : 0;
              const percent = Math.min(100, Math.round(prob * 100));

              return (
                <div
                  key={idx}
                  className={`pb-3 border-b border-white/[0.04] last:border-b-0 transition-colors ${
                    isSock ? 'pl-3 border-l border-purple-400' : ''
                  }`}
                >
                  <div className="flex items-baseline justify-between text-xs mb-2">
                    <div className="flex items-baseline gap-3 overflow-hidden">
                      <span className="font-mono text-[10px] text-[#847D8D]">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span
                        className={`tracking-[0.12em] uppercase truncate ${
                          isSock ? 'text-white font-medium' : 'text-[#C5BFC9]'
                        }`}
                      >
                        {className}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-white tracking-widest shrink-0 ml-3">
                      {percent}%
                    </span>
                  </div>

                  {/* Hairline Probability Indicator */}
                  <div className="w-full h-[2px] bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isSock
                          ? 'bg-purple-400 hairline-glow'
                          : percent > 50
                          ? 'bg-white/80'
                          : 'bg-white/30'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spatial Geometry (COCO-SSD Bounding Detections) */}
      <div className="border border-white/[0.08] bg-[#09080f]/90 backdrop-blur-2xl p-6 sm:p-8">
        <div className="flex items-baseline justify-between pb-4 border-b border-white/[0.06] mb-6">
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D] block">
              COORDINATE MAPPING
            </span>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-white uppercase mt-0.5">
              Spatial Geometry
            </h2>
          </div>
          <span className="font-mono text-[10px] tracking-widest text-[#847D8D]">
            ENTITIES // {safeDetections.length}
          </span>
        </div>

        {safeDetections.length === 0 ? (
          <p className="text-xs font-mono tracking-widest uppercase text-[#847D8D] py-6 text-center">
            No bounding coordinates mapped.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safeDetections.map((d, index) => {
              const label = d?.class || 'OBJECT';
              const score = typeof d?.score === 'number' ? (d.score * 100).toFixed(0) : '0';

              return (
                <div
                  key={index}
                  className="p-3 border border-white/[0.06] bg-white/[0.01] flex items-center justify-between"
                >
                  <span className="text-xs uppercase tracking-[0.15em] text-[#EDE8E1]">
                    {label}
                  </span>
                  <span className="font-mono text-[10px] text-purple-300 tracking-widest">
                    {score}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-[10px] font-mono tracking-[0.15em] text-[#847D8D] uppercase leading-relaxed">
          Spatial vectors generated via COCO topology &bull; Dual-tier neural pipeline
        </div>
      </div>
    </div>
  );
};
