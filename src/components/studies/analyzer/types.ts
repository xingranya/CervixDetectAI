export interface Annotation {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
  timestamp?: number;
  // Computed properties for display
  displayX?: number;
  displayY?: number;
  displayWidth?: number;
  displayHeight?: number;
  labelX?: number;
  labelY?: number;
}

export type ToolType = 'pan' | 'rect';
