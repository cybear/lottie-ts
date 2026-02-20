// @ts-nocheck
import { getLocationHref } from '../../main';
import { createElementID } from '../../utils/common';
import filtersFactory from '../../utils/filters';

const registeredEffects = {};
const idPrefix = 'filter_result_';

function SVGEffects(elem) {
  let i;
  let source = 'SourceGraphic';
  const len = elem.data.ef ? elem.data.ef.length : 0;
  const filId = createElementID();
  const fil = filtersFactory.createFilter(filId, true);
  let count = 0;
  this.filters = [];
  let filterManager;
  for (i = 0; i < len; i += 1) {
    filterManager = null;
    const type = elem.data.ef[i].ty;
    if (registeredEffects[type]) {
      const Effect = registeredEffects[type].effect;
      filterManager = new Effect(fil, elem.effectsManager.effectElements[i], elem, idPrefix + count, source);
      source = idPrefix + count;
      if (registeredEffects[type].countsAsEffect) {
        count += 1;
      }
    }
    if (filterManager) {
      this.filters.push(filterManager);
    }
  }
  if (count) {
    elem.globalData.defs.appendChild(fil);
    elem.layerElement.setAttribute('filter', 'url(' + getLocationHref() + '#' + filId + ')');
  }
  if (this.filters.length) {
    elem.addRenderableComponent(this);
  }
}

SVGEffects.prototype.renderFrame = function (_isFirstFrame) {
  let i;
  const len = this.filters.length;
  for (i = 0; i < len; i += 1) {
    this.filters[i].renderFrame(_isFirstFrame);
  }
};

SVGEffects.prototype.getEffects = function (type) {
  let i;
  const len = this.filters.length;
  const effects = [];
  for (i = 0; i < len; i += 1) {
    if (this.filters[i].type === type) {
      effects.push(this.filters[i]);
    }
  }
  return effects;
};

export function registerEffect(id, effect, countsAsEffect) {
  registeredEffects[id] = {
    effect,
    countsAsEffect,
  };
}

export default SVGEffects;
