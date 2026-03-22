// @ts-nocheck
import createNS from '../../../utils/helpers/svg_elements';

class SVGComposableEffect {
  createMergeNode(resultId, ins) {
    const feMerge = createNS('feMerge');
    feMerge.setAttribute('result', resultId);
    let feMergeNode;
    let i;
    for (i = 0; i < ins.length; i += 1) {
      feMergeNode = createNS('feMergeNode');
      feMergeNode.setAttribute('in', ins[i]);
      feMerge.appendChild(feMergeNode);
      feMerge.appendChild(feMergeNode);
    }
    return feMerge;
  }
}

export default SVGComposableEffect;
