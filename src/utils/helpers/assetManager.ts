import createTag from './html_elements';
import createNS from './svg_elements';
import featureSupport from '../featureSupport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lumaLoader = (function () {
  const id = '__lottie_element_luma_buffer';
  let lumaBuffer: HTMLCanvasElement | null = null;
  let lumaBufferCtx: CanvasRenderingContext2D | null = null;
  let svg: SVGElement | null = null;

  function createLumaSvgFilter(): SVGElement {
    const _svg = createNS('svg');
    const fil = createNS('filter');
    const matrix = createNS('feColorMatrix');
    fil.setAttribute('id', id);
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('color-interpolation-filters', 'sRGB');
    matrix.setAttribute('values', '0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0, 0.3, 0.3, 0.3, 0, 0');
    fil.appendChild(matrix);
    _svg.appendChild(fil);
    _svg.setAttribute('id', id + '_svg');
    if (featureSupport.svgLumaHidden) {
      _svg.style.display = 'none';
    }
    return _svg;
  }

  function loadLuma() {
    if (!lumaBuffer) {
      svg = createLumaSvgFilter();
      document.body.appendChild(svg);
      lumaBuffer = createTag('canvas') as HTMLCanvasElement;
      lumaBufferCtx = lumaBuffer.getContext('2d');
      lumaBufferCtx!.filter = 'url(#' + id + ')';
      lumaBufferCtx!.fillStyle = 'rgba(0,0,0,0)';
      lumaBufferCtx!.fillRect(0, 0, 1, 1);
    }
  }

  function getLuma(canvas: HTMLCanvasElement): HTMLCanvasElement {
    if (!lumaBuffer) {
      loadLuma();
    }
    lumaBuffer!.width = canvas.width;
    lumaBuffer!.height = canvas.height;
    lumaBufferCtx!.filter = 'url(#' + id + ')';
    return lumaBuffer!;
  }

  return {
    load: loadLuma,
    get: getLuma,
  };
});

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (featureSupport.offscreenCanvas) {
    return new OffscreenCanvas(width, height);
  }
  const canvas = createTag('canvas') as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Note: lumaLoader is a factory function; .load and .get are accessed on it for
// historical reasons. The cast preserves original behaviour without type errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lumaLoaderInstance = lumaLoader as any;

const assetLoader = (function () {
  return {
    loadLumaCanvas: lumaLoaderInstance.load as (() => void) | undefined,
    getLumaCanvas: lumaLoaderInstance.get as ((canvas: HTMLCanvasElement) => HTMLCanvasElement) | undefined,
    createCanvas,
  };
}());

export default assetLoader;
