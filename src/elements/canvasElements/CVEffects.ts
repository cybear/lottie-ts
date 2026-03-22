// @ts-nocheck
const registeredEffects = {};

class CVEffects {
  constructor(elem) {
    let i;
    const len = elem.data.ef ? elem.data.ef.length : 0;
    this.filters = [];
    let filterManager;
    for (i = 0; i < len; i += 1) {
      filterManager = null;
      const type = elem.data.ef[i].ty;
      if (registeredEffects[type]) {
        const Effect = registeredEffects[type].effect;
        filterManager = new Effect(elem.effectsManager.effectElements[i], elem);
      }
      if (filterManager) {
        this.filters.push(filterManager);
      }
    }
    if (this.filters.length) {
      elem.addRenderableComponent(this);
    }
  }

  renderFrame(_isFirstFrame) {
    let i;
    const len = this.filters.length;
    for (i = 0; i < len; i += 1) {
      this.filters[i].renderFrame(_isFirstFrame);
    }
  }

  getEffects(type) {
    let i;
    const len = this.filters.length;
    const effects = [];
    for (i = 0; i < len; i += 1) {
      if (this.filters[i].type === type) {
        effects.push(this.filters[i]);
      }
    }
    return effects;
  }
}

export function registerEffect(id, effect) {
  registeredEffects[id] = {
    effect,
  };
}

export default CVEffects;
