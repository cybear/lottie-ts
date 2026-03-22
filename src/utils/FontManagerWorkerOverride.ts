interface WorkerFontInstance {
  fonts: never[];
  chars: null;
  typekitLoaded: number;
  isLoaded: boolean;
  initTime: number;
}

// Worker override: replace FontManager with a minimal stub for worker context.
const FontManagerWorker = (function () {
  function Font(this: WorkerFontInstance) {
    this.fonts = [];
    this.chars = null;
    this.typekitLoaded = 0;
    this.isLoaded = false;
    this.initTime = Date.now();
  }
  return Font;
})();

export default FontManagerWorker;
