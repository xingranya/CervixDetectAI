export interface Annotation {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
  timestamp?: number;
  /** 标注来源: ai=AI自动检测, manual=手动标注 */
  source?: 'ai' | 'manual';
  /** 诊断描述 */
  description?: string;
  /** 严重程度 */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  // Computed properties for display
  displayX?: number;
  displayY?: number;
  displayWidth?: number;
  displayHeight?: number;
  labelX?: number;
  labelY?: number;
}

export type ToolType = 'pan' | 'rect';
