/**
 * Incremental runtime typings for the Lottie player (strict-typing / Track A).
 * Expand this module as `@ts-nocheck` is removed from more files.
 */

/** Composition dimensions from animation root (`animData.w` / `animData.h`). */
export interface CompSize {
  w: number;
  h: number;
}

/**
 * Renderer-global state shared by layers, masks, and modifiers.
 * Populated in stages (`setupGlobalData`, renderer `configAnimation`, per-frame updates).
 */
export interface GlobalData {
  /** Monotonic id in some render paths; may be absent until `setupGlobalData` / first frame. */
  frameId?: number;
  /** Set each frame by renderers that use it; drives layer `prepareProperties` invalidation. */
  _mdf: boolean;
  frameRate?: number;
  compSize?: CompSize;
  /** Composition name (from `animData.nm`). */
  nm?: string;
  /** Current frame index on some render paths (`SVGRendererBase.renderFrame`). */
  frameNum?: number;
  progressiveLoad?: boolean;
  /** SVG `<defs>` root; null after destroy. */
  defs?: unknown | null;
  projectInterface?: unknown;
  fontManager?: unknown;
  slotManager?: unknown;
  getAssetData?: (refId: string) => unknown;
  getAssetsPath?: (asset: unknown) => string;
  imageLoader?: unknown;
  audioController?: unknown;
  /** Canvas / hybrid render state (absent on pure SVG). */
  canvasContext?: CanvasRenderingContext2D | null;
  renderer?: unknown;
  transformCanvas?: unknown;
  /** Subset of player `renderConfig` read by layers (e.g. `hideOnTransparent`). */
  renderConfig?: RenderConfig;
  blendMode?: number;
  [key: string]: unknown;
}

/**
 * Open-ended Lottie JSON (layers, shapes, modifier payloads).
 * Prefer dedicated interfaces per feature as types are tightened.
 */
export type ElementData = Record<string, unknown>;

/** Options on `globalData.renderConfig` used by `RenderableElement`. */
export interface RenderConfig {
  hideOnTransparent?: boolean;
  imagePreserveAspectRatio?: string;
}

/** HTML solid / rect layer subset (`sw` / `sh` / `sc`). */
export type SolidColorLayerData = ElementData & {
  sw: number;
  sh: number;
  sc: string;
  hasMask?: boolean;
};

/** Image asset reference after `getAssetData` (dimensions + optional slot). */
export type ImageAssetData = ElementData & {
  w: number;
  h: number;
  pr?: string;
  sid?: string;
};

/** Shape pipeline modifier entry (`SVGShapeElement` / canvas shape stacks). */
export interface ShapeModifierLike {
  addShape(data: unknown): void;
  isAnimatedWithShape(data: unknown): boolean;
  processShapes(isFirstFrame: boolean): boolean;
}

/** Minimal audio / footage layer JSON used by `AudioElement`. */
export type AudioLayerData = ElementData & {
  refId: string;
  sr: number;
  tm?: unknown;
  au?: { lv?: unknown };
};

/** Layer timing + size fields used by `RenderableElement.checkLayerLimits` / `getLayerSize`. */
export interface LayerInOutData extends ElementData {
  ip: number;
  op: number;
  st: number;
  ty?: number;
  textData?: { width: number; height: number };
  width?: number;
  height?: number;
}

/** Text layer JSON (`t` holds text document + animators). */
export type TextLayerData = LayerInOutData & { t: unknown };

/** Image / footage layers that reference `assets` via `refId`. */
export type RefIdLayerData = LayerInOutData & { refId: string };

/** Precomposition layer JSON (`layers`, optional `xt`, time remap fields). */
export type CompLayerData = LayerInOutData & {
  xt?: boolean;
  sr: number;
  op: number;
  layers: Array<ElementData & { st: number }>;
  tm?: unknown;
};

/** Child layer instance stored on a comp (`elements[i]`). */
export interface CompChildElement {
  destroy(): void;
  prepareFrame(num: number): void;
  renderFrame(): void;
  _mdf?: boolean;
}

export interface SlotManagerLike {
  getProp(asset: unknown): unknown;
}

export interface ImageLoaderLike {
  getAsset(asset: unknown): unknown;
}

export interface AudioPlayerLike {
  play(): void;
  pause(): void;
  playing(): boolean;
  seek(t?: number): number | void;
  rate(r: number): void;
  volume(v: number): void;
}

export interface AudioControllerLike {
  createAudio(path: string): AudioPlayerLike;
  addAudio(el: unknown): void;
}

/** Minimal `finalTransform` slice for opacity / visibility checks. */
export interface FinalTransformOpacitySlice {
  mProp: {
    o: { v: number };
    _mdf?: boolean;
  };
}

/** Mask / effect components pushed via `addRenderableComponent`. */
export interface RenderableComponentEntry {
  renderFrame(isFirstFrame: boolean): void;
}

/** Layer JSON subset: optional `parent` index for `HierarchyElement.checkParenting`. */
export type LayerParentData = ElementData & { parent?: number };

/**
 * Renderer / comp host that resolves layer parenting (`buildElementParenting`).
 */
export interface ParentingHost {
  buildElementParenting(element: unknown, parentInd: number, hierarchyStack: unknown[]): void;
}

/** Minimum host passed into shape modifiers (`ShapeModifier.prototype.init`). */
export interface ModifierHostElement {
  globalData: GlobalData;
}

/** Typical animated scalar from PropertyFactory.getProp (subset). */
export interface NumericAnimatedProperty {
  v: number;
  effectsSequence: unknown[];
}

/** Entry in a layer’s `dynamicProperties` list (PropertyFactory / effects). */
export interface LayerDynamicProperty {
  getValue(): void;
  _mdf: boolean;
  propType?: string;
}
