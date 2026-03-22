import { createElementID } from '../utils/common';
import createNS from '../utils/helpers/svg_elements';
import type { AnimationItemRendererPartial, RenderConfig } from '../types/lottieRuntime';

import SVGCompElement from '../elements/svgElements/SVGCompElement';
import SVGRendererBase from './SVGRendererBase';
import type { RendererElementInstance } from '../types/lottieRuntime';
import type { RendererLayerData } from '../types/lottieRuntime';

type SVGRendererConfig = Partial<RenderConfig> & {
  preserveAspectRatio?: string;
  title?: string;
  description?: string;
};

class SVGRenderer extends SVGRendererBase {
  rendererType!: string;

  constructor(animationItem: AnimationItemRendererPartial, config?: SVGRendererConfig) {
    super();
    this.animationItem = animationItem;
    this.layers = null as unknown as RendererLayerData[];
    this.renderedFrame = -1;
    this.svgElement = createNS('svg') as SVGSVGElement;
    let ariaLabel = '';
    if (config?.title) {
      const titleElement = createNS('title');
      const titleId = createElementID();
      titleElement.setAttribute('id', titleId);
      titleElement.textContent = config.title;
      this.svgElement.appendChild(titleElement);
      ariaLabel += titleId;
    }
    if (config?.description) {
      const descElement = createNS('desc');
      const descId = createElementID();
      descElement.setAttribute('id', descId);
      descElement.textContent = config.description;
      this.svgElement.appendChild(descElement);
      ariaLabel += ' ' + descId;
    }
    if (ariaLabel) {
      this.svgElement.setAttribute('aria-labelledby', ariaLabel.trim());
    }
    const defs = createNS('defs');
    this.svgElement.appendChild(defs);
    const maskElement = createNS('g');
    this.svgElement.appendChild(maskElement);
    this.layerElement = maskElement as SVGGElement;
    this.renderConfig = {
      preserveAspectRatio: (config && config.preserveAspectRatio) || 'xMidYMid meet',
      imagePreserveAspectRatio: (config && config.imagePreserveAspectRatio) || 'xMidYMid slice',
      contentVisibility: (config && config.contentVisibility) || 'visible',
      progressiveLoad: (config && config.progressiveLoad) || false,
      hideOnTransparent: !(config && config.hideOnTransparent === false),
      viewBoxOnly: (config && config.viewBoxOnly) || false,
      viewBoxSize: (config && config.viewBoxSize) || false,
      className: (config && config.className) || '',
      id: (config && config.id) || '',
      focusable: config && config.focusable,
      filterSize: {
        width: (config && config.filterSize && config.filterSize.width) || '100%',
        height: (config && config.filterSize && config.filterSize.height) || '100%',
        x: (config && config.filterSize && config.filterSize.x) || '0%',
        y: (config && config.filterSize && config.filterSize.y) || '0%',
      },
      width: config && config.width,
      height: config && config.height,
      runExpressions: !config || config.runExpressions === undefined || config.runExpressions,
    };

    this.globalData = {
      _mdf: false,
      frameNum: -1,
      defs: defs,
      renderConfig: this.renderConfig,
    };
    this.elements = [];
    this.pendingElements = [];
    this.destroyed = false;
    this.rendererType = 'svg';
  }

  createComp(data: RendererLayerData): RendererElementInstance {
    return new SVGCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }
}

export default SVGRenderer;
