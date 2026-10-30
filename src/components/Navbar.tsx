import React from 'react';
import { Sliders, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { ModelStatus } from '../types';

interface NavbarProps {
  modelStatus: ModelStatus;
  fps: number;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  onOpenSettings: () => void;
  onReloadModels: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  modelStatus,
  fps,
  speechEnabled,
  onToggleSpeech,
  onOpenSettings,
  onReloadModels,
  activeSection,
  onSelectSection,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#060509]/80 backdrop-blur-xl border-b border-white/[0.06] px-6 lg:px-12 py-4">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left: Minimal Geometric Mark & Navigation */}
        <div className="flex items-center gap-10">
          {/* Overlapping Square Mark (matches reference design) */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectSection('feed')}>
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-4 h-4 border border-white/80 group-hover:border-purple-400 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border border-white/40 group-hover:border-purple-300 transition-colors"></div>
            </div>
            <span className="font-display tracking-[0.15em] text-lg text-white font-normal uppercase hidden sm:inline">
              TRANSCEND
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium tracking-[0.2em] text-[#C5BFC9]/70 uppercase">
            <button
              onClick={() => onSelectSection('feed')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeSection === 'feed' ? 'text-white border-b border-purple-400' : ''
              }`}
            >
              Optical Feed
            </button>
            <button
              onClick={() => onSelectSection('classification')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeSection === 'classification' ? 'text-white border-b border-purple-400' : ''
              }`}
            >
              Class Spectrum
            </button>
            <button
              onClick={() => onSelectSection('calibration')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeSection === 'calibration' ? 'text-white border-b border-purple-400' : ''
              }`}
            >
              Neural Calibration
            </button>
            <button
              onClick={() => onSelectSection('archive')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeSection === 'archive' ? 'text-white border-b border-purple-400' : ''
              }`}
            >
              Archive
            </button>
          </nav>
        </div>

        {/* Right: Technical Readout & Controls */}
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] tracking-[0.15em] uppercase">
          {/* Telemetry Readout */}
          <div className="hidden lg:flex items-center gap-5 text-[#847D8D] font-mono text-[10px]">
            <span>ENGINE // {modelStatus.backendName || 'WEBGL'}</span>
            <span className="text-white/20">|</span>
            <span>FPS // <strong className="text-white font-normal">{fps.toFixed(0)}</strong></span>
          </div>

          {/* Speech Audio Toggle */}
          <button
            onClick={onToggleSpeech}
            className="flex items-center gap-2 text-[#C5BFC9] hover:text-white transition-colors"
            title="Audio synthesized response"
          >
            {speechEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-purple-400 stroke-[1.5]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#847D8D] stroke-[1.5]" />
            )}
            <span className="hidden sm:inline text-[10px] text-[#847D8D]">
              {speechEnabled ? 'VOICE ON' : 'MUTED'}
            </span>
          </button>

          {/* Model Reset */}
          <button
            onClick={onReloadModels}
            className="text-[#847D8D] hover:text-white transition-colors p-1"
            title="Re-synchronize models"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Parameters Modal */}
          <button
            onClick={onOpenSettings}
            className="text-[#847D8D] hover:text-white transition-colors p-1"
            title="System Parameters"
          >
            <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Luxury CTA (Matches "EXPLORE" in reference) */}
          <button
            onClick={() => {
              const el = document.getElementById('camera-viewport');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 border border-white/20 hover:border-purple-400 text-white font-semibold text-[10px] tracking-mega hover:bg-white/[0.04] transition-all uppercase"
          >
            EXPLORE
          </button>
        </div>
      </div>
    </header>
  );
};
