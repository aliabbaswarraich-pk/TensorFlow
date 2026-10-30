import React from 'react';
import { HistoryItem } from '../types';

interface DetectionHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export const DetectionHistory: React.FC<DetectionHistoryProps> = ({
  history,
  onClearHistory,
  onDeleteItem,
}) => {
  const handleDownload = (item: HistoryItem) => {
    if (!item.imageSrc) return;
    const a = document.createElement('a');
    a.href = item.imageSrc;
    a.download = `FRAME_${item.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="border border-white/[0.08] bg-[#09080f]/90 backdrop-blur-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-baseline justify-between pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D] block">
            VISUAL REPOSITORY
          </span>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-white uppercase mt-0.5">
            Optical Archive ({history.length})
          </h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#847D8D] hover:text-white transition-colors"
          >
            PURGE ARCHIVE
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center text-[#847D8D] text-xs font-mono tracking-widest uppercase">
          Archive empty. Trigger "CAPTURE FRAME" on the optical sensor bar to document subjects.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {history.map((item, idx) => (
            <div
              key={item.id}
              className="group border border-white/[0.08] bg-white/[0.01] hover:border-purple-400/60 transition-all flex flex-col"
            >
              {item.imageSrc && (
                <div className="aspect-video w-full bg-black overflow-hidden relative">
                  <img
                    src={item.imageSrc}
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleDownload(item)}
                      className="px-2 py-1 text-[9px] font-mono tracking-widest uppercase text-white border border-white/40 hover:border-purple-400 bg-black/80"
                    >
                      EXPORT
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="px-2 py-1 text-[9px] font-mono tracking-widest uppercase text-red-300 border border-red-500/40 hover:border-red-400 bg-black/80"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 flex flex-col gap-1 border-t border-white/[0.06]">
                <span className="text-[10px] tracking-[0.15em] uppercase text-white truncate font-mono">
                  {item.label}
                </span>
                <div className="flex items-center justify-between text-[9px] font-mono text-[#847D8D] tracking-widest">
                  <span>{(item.confidence * 100).toFixed(0)}%</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
