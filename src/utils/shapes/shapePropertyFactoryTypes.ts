import type { MaskDefinitionJson } from '../../types/lottieRuntime';

/** Narrow export for `ShapePropertyFactory.getShapeProp` (module body is still `@ts-nocheck`). */
export type ShapePropertyFactoryApi = {
  getShapeProp(elem: unknown, data: MaskDefinitionJson, type: number): unknown;
};
