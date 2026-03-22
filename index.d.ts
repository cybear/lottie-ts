export type AnimationDirection = 1 | -1;
export type AnimationSegment = [number, number];
export type AnimationEventName = 'drawnFrame' | 'enterFrame' | 'loopComplete' | 'complete' | 'segmentStart' | 'destroy' | 'config_ready' | 'data_ready' | 'DOMLoaded' | 'error' | 'data_failed' | 'loaded_images';
export type AnimationEventCallback<T = any> = (args: T) => void;

/** Specifies the data for each event type. */
export interface AnimationEvents {
  DOMLoaded: undefined;
  complete: BMCompleteEvent;
  config_ready: undefined;
  data_failed: undefined;
  data_ready: undefined;
  destroy: BMDestroyEvent;
  drawnFrame: BMEnterFrameEvent;
  enterFrame: BMEnterFrameEvent;
  error: undefined;
  loaded_images: undefined;
  loopComplete: BMCompleteLoopEvent;
  segmentStart: BMSegmentStartEvent;
}

export interface BMCompleteEvent {
  direction: number;
  type: "complete";
}

export interface BMCompleteLoopEvent {
  currentLoop: number;
  direction: number;
  totalLoops: number;
  type: "loopComplete";
}

export interface BMDestroyEvent {
  type: "destroy";
}

export interface BMEnterFrameEvent {
  /** The current time in frames. */
  currentTime: number;
  direction: number;
  /** The total number of frames. */
  totalTime: number;
  type: "enterFrame";
}

export interface BMSegmentStartEvent {
  firstFrame: number;
  totalFrames: number;
  type: "segmentStart";
}

export type AnimationItem = {
    name: string;
    isLoaded: boolean;
    currentFrame: number;
    currentRawFrame: number;
    firstFrame: number;
    totalFrames: number;
    frameRate: number;
    frameMult: number;
    playSpeed: number;
    playDirection: number;
    playCount: number;
    isPaused: boolean;
    autoplay: boolean;
    loop: boolean | number;
    renderer: any;
    animationID: string;
    assetsPath: string;
    timeCompleted: number;
    segmentPos: number;
    isSubframeEnabled: boolean;
    segments: AnimationSegment | AnimationSegment[];
    /** Shorthand callback — fires when the animation completes (non-looping). */
    onComplete: ((event: BMCompleteEvent) => void) | null;
    /** Shorthand callback — fires when a loop iteration completes. */
    onLoopComplete: ((event: BMCompleteLoopEvent) => void) | null;
    /** Shorthand callback — fires on every rendered frame. */
    onEnterFrame: ((event: BMEnterFrameEvent) => void) | null;
    /** Shorthand callback — fires when a new segment starts. */
    onSegmentStart: ((event: BMSegmentStartEvent) => void) | null;
    play(name?: string): void;
    stop(name?: string): void;
    togglePause(name?: string): void;
    destroy(name?: string): void;
    pause(name?: string): void;
    goToAndStop(value: number | string, isFrame?: boolean, name?: string): void;
    goToAndPlay(value: number | string, isFrame?: boolean, name?: string): void;
    includeLayers(data: any): void;
    setSegment(init: number, end: number): void;
    resetSegments(forceFlag: boolean): void;
    hide(): void;
    show(): void;
    resize(width?: number, height?: number): void;
    setSpeed(speed: number): void;
    setDirection(direction: AnimationDirection): void;
    setLoop(isLooping: boolean): void;
    playSegments(segments: AnimationSegment | AnimationSegment[], forceFlag?: boolean): void;
    setSubframe(useSubFrames: boolean): void;
    getDuration(inFrames?: boolean): number;
    /**
     * Update a text layer's document data at runtime.
     * @param path  Array of layer names / indices forming a path to the text layer.
     * @param documentData  Partial text data to merge in.
     * @param index  Keyframe index (default 0).
     */
    updateDocumentData(path: (string | number)[], documentData: Partial<TextDocumentData>, index?: number): void;
    triggerEvent<T extends AnimationEventName>(name: T, args: AnimationEvents[T]): void;
    addEventListener<T extends AnimationEventName>(name: T, callback: AnimationEventCallback<AnimationEvents[T]>): () => void;
    removeEventListener<T extends AnimationEventName>(name: T, callback?: AnimationEventCallback<AnimationEvents[T]>): void;
}

export type BaseRendererConfig = {
    imagePreserveAspectRatio?: string;
    className?: string;
    /** Sets the `id` attribute on the root renderer element. */
    id?: string;
};

export type SVGRendererConfig = BaseRendererConfig & {
    title?: string;
    description?: string;
    preserveAspectRatio?: string;
    progressiveLoad?: boolean;
    hideOnTransparent?: boolean;
    viewBoxOnly?: boolean;
    viewBoxSize?: string;
    focusable?: boolean;
    filterSize?: FilterSizeConfig;
    /** CSS `content-visibility` value on the root element (default: `'visible'`). */
    contentVisibility?: string;
    /** Enable or disable expression evaluation for this animation (default: `true`). */
    runExpressions?: boolean;
};

export type CanvasRendererConfig = BaseRendererConfig & {
    clearCanvas?: boolean;
    context?: CanvasRenderingContext2D;
    progressiveLoad?: boolean;
    preserveAspectRatio?: string;
    dpr?: number;
    /** CSS `content-visibility` value on the canvas element (default: `'visible'`). */
    contentVisibility?: string;
    /** Enable or disable expression evaluation for this animation (default: `true`). */
    runExpressions?: boolean;
};

export type HTMLRendererConfig = BaseRendererConfig & {
    hideOnTransparent?: boolean;
    filterSize?: FilterSizeConfig;
    /** Enable or disable expression evaluation for this animation (default: `true`). */
    runExpressions?: boolean;
};

export type RendererType = 'svg' | 'canvas' | 'html';

export type AnimationConfig<T extends RendererType = 'svg'> = {
    container: Element;
    renderer?: T;
    loop?: boolean | number;
    autoplay?: boolean;
    initialSegment?: AnimationSegment;
    name?: string;
    assetsPath?: string;
    rendererSettings?: {
        svg: SVGRendererConfig;
        canvas: CanvasRendererConfig;
        html: HTMLRendererConfig;
    }[T]
    audioFactory?(assetPath: string): {
        play(): void
        seek(): void
        playing(): void
        rate(): void
        setVolume(): void
    }
}

export type TextDocumentData = {
    /** Text string content. */
    t?: string;
    /** Font size. */
    s?: number;
    /** Font family name. */
    f?: string;
    /** Cap height (used internally by AE). */
    ca?: number;
    /** Justification: 0 = left, 1 = right, 2 = centre, 3 = full. */
    j?: number;
    /** Tracking (letter spacing in AE units). */
    tr?: number;
    /** Line height. */
    lh?: number;
    /** Baseline shift. */
    ls?: number;
    /** Fill colour as [r, g, b] in 0–1 range. */
    fc?: [number, number, number];
    /** Stroke colour as [r, g, b] in 0–1 range. */
    sc?: [number, number, number];
    /** Stroke width. */
    sw?: number;
}

export type AnimationConfigWithPath<T extends RendererType = 'svg'> = AnimationConfig<T> & {
    path?: string;
}

export type AnimationConfigWithData<T extends RendererType = 'svg'> = AnimationConfig<T> & {
    animationData?: any;
}

export type FilterSizeConfig = {
    width: string;
    height: string;
    x: string;
    y: string;
};

export type LottiePlayer = {
    /** Play all animations (or the named one). */
    play(name?: string): void;
    /** Pause all animations (or the named one). */
    pause(name?: string): void;
    /** Stop all animations (or the named one), resetting to the first frame. */
    stop(name?: string): void;
    /** Toggle pause on all animations (or the named one). */
    togglePause(name?: string): void;
    setSpeed(speed: number, name?: string): void;
    setDirection(direction: AnimationDirection, name?: string): void;
    /** Move all animations (or the named one) to a specific time/frame, paused. */
    goToAndStop(value: number | string, isFrame?: boolean, name?: string): void;
    searchAnimations(animationData?: any, standalone?: boolean, renderer?: string): void;
    loadAnimation<T extends RendererType = 'svg'>(params: AnimationConfigWithPath<T> | AnimationConfigWithData<T>): AnimationItem;
    destroy(name?: string): void;
    registerAnimation(element: Element, animationData?: any): void;
    /** Returns an array of all active AnimationItem instances. */
    getRegisteredAnimations(): AnimationItem[];
    /** Notify all animations that their container was resized. */
    resize(): void;
    setQuality(quality: string | number): void;
    setLocationHref(href: string): void;
    setIDPrefix(prefix: string): void;
    /** Freeze all animations (stops the render loop without destroying them). */
    freeze(): void;
    /** Resume all frozen animations. */
    unfreeze(): void;
    /** Set volume for audio layers (0–1). */
    setVolume(volume: number, name?: string): void;
    /** Mute audio for all animations (or the named one). */
    mute(name?: string): void;
    /** Unmute audio for all animations (or the named one). */
    unmute(name?: string): void;
    /** Enable or disable subframe rendering globally. */
    setSubframeRendering(flag: boolean): void;
    /** Enable or disable Web Worker rendering for canvas animations. */
    useWebWorker(flag: boolean): void;
    /** Returns true when running in a browser environment. */
    inBrowser(): boolean;
    /** The lottie-ts version string. */
    version: string;
};

declare const Lottie: LottiePlayer;

export default Lottie;
