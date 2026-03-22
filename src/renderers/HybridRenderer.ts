// @ts-nocheck
import HybridRendererBase from './HybridRendererBase';
import HCompElement from '../elements/htmlElements/HCompElement';
import SVGCompElement from '../elements/svgElements/SVGCompElement';

class HybridRenderer extends HybridRendererBase {
  constructor(animationItem, config) {
    super(animationItem, config);
    this.renderConfig.runExpressions = !config || config.runExpressions === undefined || config.runExpressions;
  }

  createComp(data) {
    if (!this.supports3d) {
      return new SVGCompElement(data, this.globalData, this);
    }
    return new HCompElement(data, this.globalData, this);
  }
}

export default HybridRenderer;
