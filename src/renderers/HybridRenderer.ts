import HybridRendererBase from './HybridRendererBase';
import HCompElement from '../elements/htmlElements/HCompElement';
import SVGCompElement from '../elements/svgElements/SVGCompElement';
import type {
  AnimationItemRendererPartial,
  RenderConfig,
  RendererElementInstance,
  RendererLayerData,
} from '../types/lottieRuntime';

class HybridRenderer extends HybridRendererBase {
  constructor(animationItem: AnimationItemRendererPartial, config?: Partial<RenderConfig>) {
    super(animationItem, config);
    this.renderConfig.runExpressions = !config || config.runExpressions === undefined || config.runExpressions;
  }

  createComp(data: RendererLayerData, ..._args: unknown[]): RendererElementInstance {
    if (!this.supports3d) {
      return new SVGCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
    }
    return new HCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }
}

export default HybridRenderer;
