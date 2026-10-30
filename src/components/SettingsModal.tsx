import React from 'react';
import { X } from 'lucide-react';
import { AppSettings, ModelStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  modelStatus: ModelStatus;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  modelStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg border border-white/10 bg-[#09080f] p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-baseline justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D] block">
              SYSTEM CONFIGURATION
            </span>
            <h3 className="text-sm font-semibold tracking-[0.2em] text-white uppercase mt-0.5">
              Neural Parameters
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#847D8D] hover:text-white transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-6 text-xs text-[#C5BFC9]">
          {/* Confidence Threshold */}
          <div>
            <div className="flex justify-between items-center mb-2 font-mono text-[11px] tracking-widest uppercase">
              <span className="text-[#EDE8E1]">CONFIDENCE CUTOFF</span>
              <span className="text-purple-300">
                {(settings.confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.85"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) =>
                onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-400 bg-white/10 h-1 cursor-pointer"
            />
            <p className="text-[10px] text-[#847D8D] font-mono tracking-wide mt-1.5 uppercase">
              Filter probability threshold for archetype verification.
            </p>
          </div>

          {/* Voice Announcements */}
          <div className="pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] tracking-widest text-[#EDE8E1] uppercase">
                SYNTHESIZED VOCAL NOTIFICATION
              </span>
              <input
                type="checkbox"
                checked={settings.speechEnabled}
                onChange={(e) => onUpdateSettings({ speechEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-400 bg-transparent border-white/20"
              />
            </div>

            {settings.speechEnabled && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-[#847D8D] tracking-widest uppercase">
                  <span>SPEECH COOLDOWN INTERVAL</span>
                  <span className="text-purple-300">
                    {(settings.speechCooldownMs / 1000).toFixed(1)}S
                  </span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max="8000"
                  step="500"
                  value={settings.speechCooldownMs}
                  onChange={(e) =>
                    onUpdateSettings({ speechCooldownMs: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-purple-400 bg-white/10 h-1 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Overlay Boxes */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-widest text-[#EDE8E1] uppercase">
              RENDER SPATIAL RETICLES
            </span>
            <input
              type="checkbox"
              checked={settings.showOverlayBoxes}
              onChange={(e) => onUpdateSettings({ showOverlayBoxes: e.target.checked })}
              className="w-4 h-4 accent-purple-400 bg-transparent border-white/20"
            />
          </div>

          {/* Model Engines */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <span className="font-mono text-[11px] tracking-widest text-[#EDE8E1] uppercase block">
              ACTIVE NEURAL PIPELINES
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 border border-white/[0.08] bg-white/[0.01] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableMobileNet}
                  onChange={(e) => onUpdateSettings({ enableMobileNet: e.target.checked })}
                  className="accent-purple-400"
                />
                <span className="text-[10px] font-mono tracking-widest uppercase text-white">
                  MOBILENET (1K)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 border border-white/[0.08] bg-white/[0.01] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCocoSsd}
                  onChange={(e) => onUpdateSettings({ enableCocoSsd: e.target.checked })}
                  className="accent-purple-400"
                />
                <span className="text-[10px] font-mono tracking-widest uppercase text-white">
                  COCO-SSD SPATIAL
                </span>
              </label>
            </div>
          </div>

          {/* Diagnostics */}
          <div className="p-4 border border-white/[0.06] bg-black/40 text-[10px] font-mono space-y-1 tracking-widest uppercase">
            <div className="flex justify-between text-[#847D8D]">
              <span>ACCELERATION BACKEND:</span>
              <span className="text-white">{modelStatus.backendName || 'WEBGL'}</span>
            </div>
            <div className="flex justify-between text-[#847D8D]">
              <span>DEVICE PIPELINE:</span>
              <span className="text-white">CLIENT-SIDE HARDWARE</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-white/20 hover:border-purple-400 text-white font-mono text-[10px] tracking-[0.2em] uppercase transition-all"
          >
            CONFIRM & APPLY
          </button>
        </div>
      </div>
    </div>
  );
};
