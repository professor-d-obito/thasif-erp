import { useMemo } from 'react';

// Curated high-aesthetic gradient presets
export const GRADIENT_PRESETS = [
  { id: 'crimson-void', name: 'Crimson Void', value: 'linear-gradient(135deg, rgba(255, 42, 95, 0.12) 0%, rgba(13, 14, 21, 0.95) 100%)' },
  { id: 'amethyst-cyber', name: 'Amethyst Cyber', value: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(12, 13, 24, 0.95) 100%)' },
  { id: 'deep-ocean', name: 'Deep Cyber Ocean', value: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(10, 14, 26, 0.96) 100%)' },
  { id: 'emerald-matrix', name: 'Emerald Matrix', value: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(8, 15, 18, 0.95) 100%)' },
  { id: 'solar-flare', name: 'Solar Flare', value: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(18, 13, 24, 0.96) 100%)' },
  { id: 'midnight-carbon', name: 'Midnight Carbon', value: 'linear-gradient(180deg, rgba(20, 20, 28, 0.9) 0%, rgba(10, 10, 15, 0.98) 100%)' }
];

// Default initial backgrounds per module
export const DEFAULT_MODULE_BACKGROUNDS = {
  dashboard: { type: 'gradient', value: 'linear-gradient(135deg, rgba(255, 42, 95, 0.08) 0%, rgba(13, 14, 21, 0.92) 100%)', overlayOpacity: 0.8 },
  inventory: { type: 'gradient', value: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(12, 13, 24, 0.92) 100%)', overlayOpacity: 0.8 },
  invoicing: { type: 'gradient', value: 'linear-gradient(135deg, rgba(245, 158, 11, 0.07) 0%, rgba(13, 14, 21, 0.92) 100%)', overlayOpacity: 0.8 },
  finance: { type: 'gradient', value: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(10, 14, 22, 0.94) 100%)', overlayOpacity: 0.8 },
  operatives: { type: 'gradient', value: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(10, 14, 26, 0.92) 100%)', overlayOpacity: 0.8 },
  projects: { type: 'gradient', value: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(13, 14, 21, 0.92) 100%)', overlayOpacity: 0.8 },
  notesReminders: { type: 'gradient', value: 'linear-gradient(135deg, rgba(139, 92, 246, 0.09) 0%, rgba(15, 15, 28, 0.93) 100%)', overlayOpacity: 0.8 },
  googleDrive: { type: 'gradient', value: 'linear-gradient(135deg, rgba(37, 99, 235, 0.09) 0%, rgba(10, 14, 28, 0.94) 100%)', overlayOpacity: 0.8 },
  customModules: { type: 'gradient', value: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(13, 14, 21, 0.92) 100%)', overlayOpacity: 0.8 },
  roles: { type: 'gradient', value: 'linear-gradient(135deg, rgba(255, 42, 95, 0.09) 0%, rgba(14, 15, 24, 0.94) 100%)', overlayOpacity: 0.8 },
  settings: { type: 'gradient', value: 'linear-gradient(135deg, rgba(100, 116, 139, 0.08) 0%, rgba(13, 14, 21, 0.92) 100%)', overlayOpacity: 0.8 },
};

/**
 * Hook to retrieve and compute background style for a specific module container.
 * @param {string} moduleKey - e.g. 'dashboard', 'googleDrive', 'notesReminders'
 * @param {object} moduleThemes - The user preferences moduleThemes object
 */
export function useModuleTheme(moduleKey, moduleThemes = {}) {
  return useMemo(() => {
    const config = moduleThemes?.[moduleKey] || DEFAULT_MODULE_BACKGROUNDS[moduleKey] || {
      type: 'gradient',
      value: 'transparent',
      overlayOpacity: 0.8
    };

    const style = {
      transition: 'background 0.3s ease, border-color 0.3s ease',
      borderRadius: 'var(--radius-lg, 12px)',
      position: 'relative'
    };

    if (config.type === 'color') {
      style.backgroundColor = config.value;
      style.backgroundImage = 'none';
    } else if (config.type === 'gradient') {
      style.backgroundImage = config.value;
    } else if (config.type === 'image') {
      const opacity = config.overlayOpacity !== undefined ? config.overlayOpacity : 0.85;
      style.backgroundImage = `linear-gradient(rgba(10, 11, 16, ${opacity}), rgba(10, 11, 16, ${opacity})), url("${config.value}")`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
      style.backgroundAttachment = 'local';
    }

    return {
      style,
      config,
      isCustomized: Boolean(moduleThemes?.[moduleKey])
    };
  }, [moduleKey, moduleThemes]);
}
