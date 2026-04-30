import type { Annotation as AnalyzerAnnotation } from 'components/studies/analyzer/types';

export interface SuspiciousAreaLike {
  description?: string;
  location?: string;
  box_2d?: number[];
  bbox_2d?: number[];
  features?: string[];
}

export interface NormalizedSuspiciousAreaBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function clampNormalizedCoordinate(value: number) {
  return Math.max(0, Math.min(value, 999));
}

export function toPixelCoordinate(value: number, size: number) {
  return (clampNormalizedCoordinate(value) / 1000) * size;
}

export function resolveSuspiciousAreaBox(
  area: SuspiciousAreaLike,
): NormalizedSuspiciousAreaBox | null {
  const officialBox = Array.isArray(area.bbox_2d) ? area.bbox_2d : null;
  if (officialBox && officialBox.length === 4) {
    const x1 = officialBox[0];
    const y1 = officialBox[1];
    const x2 = officialBox[2];
    const y2 = officialBox[3];
    if ([x1, y1, x2, y2].some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
      return null;
    }
    return {
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2),
    };
  }

  const projectBox = Array.isArray(area.box_2d) ? area.box_2d : null;
  if (projectBox && projectBox.length === 4) {
    const ymin = projectBox[0];
    const xmin = projectBox[1];
    const ymax = projectBox[2];
    const xmax = projectBox[3];
    if (
      [ymin, xmin, ymax, xmax].some((value) => typeof value !== 'number' || !Number.isFinite(value))
    ) {
      return null;
    }
    return {
      x1: Number(xmin),
      y1: Number(ymin),
      x2: Number(xmax),
      y2: Number(ymax),
    };
  }

  return null;
}

export function convertSuspiciousAreasToAnnotations(params: {
  areas?: SuspiciousAreaLike[] | null;
  imageWidth: number;
  imageHeight: number;
  confidence?: number;
}): AnalyzerAnnotation[] {
  const { areas, imageWidth, imageHeight, confidence = 0.85 } = params;
  if (!areas?.length || !imageWidth || !imageHeight) return [];

  return areas
    .map((area): AnalyzerAnnotation | null => {
      const normalizedBox = resolveSuspiciousAreaBox(area);
      if (!normalizedBox) return null;

      const minX = Math.min(normalizedBox.x1, normalizedBox.x2);
      const minY = Math.min(normalizedBox.y1, normalizedBox.y2);
      const maxX = Math.max(normalizedBox.x1, normalizedBox.x2);
      const maxY = Math.max(normalizedBox.y1, normalizedBox.y2);

      const x = toPixelCoordinate(minX, imageWidth);
      const y = toPixelCoordinate(minY, imageHeight);
      const width = toPixelCoordinate(maxX, imageWidth) - x;
      const height = toPixelCoordinate(maxY, imageHeight) - y;

      if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) return null;

      return {
        type: 'rect',
        x,
        y,
        width,
        height,
        label: area.description || '异常区域',
        confidence,
        source: 'ai',
        description: area.location || area.features?.join('、') || area.description || 'AI识别区域',
      };
    })
    .filter((item): item is AnalyzerAnnotation => item !== null);
}
