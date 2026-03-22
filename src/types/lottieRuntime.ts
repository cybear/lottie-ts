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
  /** Composition host reference on some render paths (e.g. hybrid `createComp`). */
  comp?: unknown;
  /** Subset of player `renderConfig` read by layers (e.g. `hideOnTransparent`). */
  renderConfig?: RenderConfig;
  blendMode?: number | string;
  [key: string]: unknown;
}

/**
 * Open-ended Lottie JSON (layers, shapes, modifier payloads).
 * Prefer dedicated interfaces per feature as types are tightened.
 */
export type ElementData = Record<string, unknown>;

/**
 * Canvas renderer surface bound to `CVContextData` / native context (`CanvasRenderer` when `clearCanvas`).
 * Used by canvas layer elements for draw calls.
 */
export interface CanvasRenderer2D {
  save(force?: boolean): void;
  restore(force?: boolean): void;
  ctxTransform(props: number[]): void;
  ctxOpacity(op: number): void;
  ctxFillStyle(value: string | CanvasGradient | CanvasPattern): void;
  ctxStrokeStyle(value: string | CanvasGradient | CanvasPattern): void;
  ctxLineWidth(value: number): void;
  ctxLineCap(value: CanvasLineCap): void;
  ctxLineJoin(value: CanvasLineJoin): void;
  ctxMiterLimit(value: number): void;
  ctxFill(rule?: CanvasFillRule): void;
  ctxFillRect(x: number, y: number, w: number, h: number): void;
  ctxStroke(): void;
}

/** `globalData` on canvas image layers (`getAssetData` + `imageLoader` + 2D renderer). */
export type GlobalDataCanvasImage = GlobalData & {
  getAssetData: (refId: string) => ImageAssetData;
  imageLoader: ImageLoaderLike;
  renderer: CanvasRenderer2D;
  canvasContext: CanvasRenderingContext2D;
  renderConfig: RenderConfig;
};

/** `globalData` on canvas solid / shape / text layers (2D renderer + context). */
export type GlobalDataCanvasLayer = GlobalData & {
  renderer: CanvasRenderer2D;
  canvasContext: CanvasRenderingContext2D;
  currentGlobalAlpha?: number;
};

/** Options on `globalData.renderConfig` used by `RenderableElement` and renderer constructors. */
export interface RenderConfig {
  hideOnTransparent?: boolean;
  imagePreserveAspectRatio?: string;
  preserveAspectRatio?: string;
  progressiveLoad?: boolean;
  contentVisibility?: string;
  className?: string;
  id?: string;
  viewBoxOnly?: boolean;
  viewBoxSize?: string | false;
  width?: string | number;
  height?: string | number;
  focusable?: string;
  title?: string;
  description?: string;
  runExpressions?: boolean;
  clearCanvas?: boolean;
  context?: CanvasRenderingContext2D | null;
  dpr?: number;
  filterSize?: { width: string; height: string; x: string; y: string };
}

/** `globalData.projectInterface` subset used by renderers. */
export interface ProjectInterfaceLike {
  registerComposition(comp: unknown): void;
  currentFrame?: number;
}

/** Built layer instance stored in `renderer.elements[i]` (or `true` while building). */
export interface RendererElementInstance {
  destroy(): void;
  prepareFrame(num: number): void;
  renderFrame(): void;
  initExpressions(): void;
  getBaseElement(): Element | null;
  data: ElementData;
  checkParenting(): void;
  setMatte?(m: unknown): void;
  getMatte?(tt: unknown): unknown;
  setAsParent?(): void;
  setHierarchy?(h: unknown[]): void;
  getElementByPath?(path: unknown[]): unknown;
}

export type RendererElementSlot = RendererElementInstance | true | null | undefined;

/** `AnimationItem` fields renderers rely on (avoid importing the full class). */
export interface AnimationItemRendererPartial {
  wrapper: HTMLElement;
  container?: HTMLCanvasElement | HTMLElement | null;
  getAssetData: (refId: string) => unknown;
  getAssetsPath: (asset: unknown) => string;
  imagePreloader: unknown;
  audioController: unknown;
  _isFirstFrame?: number;
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

/** Layer row from animation JSON as used by renderers (`layers[]`). */
export type RendererLayerData = LayerInOutData & {
  ind: number;
  ty: number;
  id?: number | string;
  parent?: number;
  nm?: string;
  tt?: unknown;
  tp?: number;
  ddd?: boolean;
  xt?: boolean;
};

/** Root animation JSON fields read in `BaseRenderer.setupGlobalData` / `configAnimation`. */
export interface AnimationRootData {
  w: number;
  h: number;
  nm?: string;
  fr: number;
  layers: RendererLayerData[];
  chars?: unknown;
  fonts?: unknown;
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
  /** Precomp frame size (canvas clip / hybrid mask SVG size). */
  w?: number;
  h?: number;
  /** Hybrid HTML comp: when true, embeds SVG mask wrapper and disables 3D path. */
  hasMask?: boolean;
};

/** Child layer instance stored on a comp (`elements[i]`). */
export interface CompChildElement {
  destroy(): void;
  prepareFrame(num: number): void;
  renderFrame(): void;
  _mdf?: boolean;
  /** Present on DOM / hybrid layer instances (`HCompElement.addTo3dContainer`). */
  getBaseElement?: () => Element | null;
}

export interface SlotManagerLike {
  getProp(asset: unknown): unknown;
}

export interface ImageLoaderLike {
  getAsset(asset: unknown): unknown;
}

/** Subset of `FontManager` used by canvas text rendering. */
export interface FontManagerLike {
  getFontByName(name: string): { fStyle: string; fFamily: string };
  getCharData(char: string, style: string, family: string): { data?: { shapes?: Array<{ it: unknown[] }> } } | null;
}

/** `globalData` for canvas text layers. */
export type GlobalDataCanvasText = GlobalDataCanvasLayer & {
  fontManager: FontManagerLike;
};

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

/** One entry in `data.masksProperties` (`BaseElement.checkMasks`). */
export interface MaskPropertyEntry {
  mode: string;
  cl?: boolean;
}

/** Mask row JSON consumed by `MaskElement` / `CVMaskElement` / `ShapePropertyFactory`. */
export interface MaskDefinitionJson extends MaskPropertyEntry {
  inv?: boolean;
  o?: unknown;
  x?: unknown;
  pt?: unknown;
  ks?: unknown;
}

/** Layer `data` slice passed into `MaskElement` / `CVMaskElement` constructors. */
export type MaskHostLayerData = ElementData & {
  masksProperties?: MaskDefinitionJson[];
};

/** Effect JSON group or leaf (`EffectsManager` / `GroupEffect` / slider rows). */
export type EffectJsonEntry = ElementData & {
  ty?: number;
  ef?: EffectJsonEntry[];
};

/** Animated property bag on one row of `GroupEffect.effectElements` / slider helpers. */
export interface EffectAnimatedProp {
  v: number | number[];
  k?: unknown;
  _mdf?: boolean;
}

export interface EffectValueRow {
  p: EffectAnimatedProp;
}

/**
 * `GroupEffect` surface used by SVG filter constructors, `TransformEffect`, and canvas transform.
 * `container` is the host layer (`DynamicPropertyContainer.container`).
 */
export interface GroupEffectLike {
  _mdf: boolean;
  effectElements: EffectValueRow[];
  container?: unknown;
  data?: ElementData;
}

/** Layer fields used by `BaseElement` (init, masks, blend mode, expressions). */
export type BaseInitLayerData = ElementData & {
  hasMask?: boolean;
  masksProperties?: MaskPropertyEntry[];
  ty?: number;
  xt?: boolean;
  bm?: number;
  sr?: number;
  ef?: EffectJsonEntry[];
};

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
