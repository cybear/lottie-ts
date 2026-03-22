/**
 * Incremental runtime typings for the Lottie player (strict-typing / Track A).
 * Expand this module as `@ts-nocheck` is removed from more files.
 */

/** Renderer-global state accessed from layers and modifiers. */
export interface GlobalData {
  frameId: number;
}

/**
 * Open-ended Lottie JSON (layers, shapes, modifier payloads).
 * Prefer dedicated interfaces per feature as types are tightened.
 */
export type ElementData = Record<string, unknown>;

/** Minimum host passed into shape modifiers (`ShapeModifier.prototype.init`). */
export interface ModifierHostElement {
  globalData: GlobalData;
}

/** Typical animated scalar from PropertyFactory.getProp (subset). */
export interface NumericAnimatedProperty {
  v: number;
  effectsSequence: unknown[];
}
