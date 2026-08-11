
export interface Particle {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  createdAt: number; // Timestamp when created
}

export interface AppConfig {
  sensitivity: number; // Audio threshold
  particleScale: number; // Size multiplier
  gravity: number; // Positive = down, Negative = up
  useMouthTracking: boolean;
  fixedText: string; // User specified text override
  minMouthOpenness: number; // Threshold for jawOpen blendshape (0.0 to 1.0)
}

export const DEFAULT_WORDS = [
  "🤬", "💢", "POW!", "BOOM", "💥", 
  "WTF", "Argh!", "😤", "XXX", "!!!",
  "No!", "Stop", "💀", "🔥", "⚡️"
];

// Fallback mouth position if tracking fails
export const DEFAULT_MOUTH_POS = { x: 0.5, y: 0.6 };
