/** Narrow export for `ShapePropertyFactory.getShapeProp` (factory default export stays loosely typed at boundary). */
export type ShapePropertyFactoryApi = {
  /** Extra args are ignored by the factory but may be passed by SVG layers / expression decorators. */
  getShapeProp(elem: unknown, data: unknown, type: number, ..._extra: unknown[]): unknown;
};
