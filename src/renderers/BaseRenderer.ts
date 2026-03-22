// @ts-nocheck
import FontManager from '../utils/FontManager';
import slotFactory from '../utils/SlotManager';
import FootageElement from '../elements/FootageElement';
import AudioElement from '../elements/AudioElement';

class BaseRenderer {
  checkLayers(num) {
    let i;
    const len = this.layers.length;
    let data;
    this.completeLayers = true;
    for (i = len - 1; i >= 0; i -= 1) {
      if (!this.elements[i]) {
        data = this.layers[i];
        if (data.ip - data.st <= num - this.layers[i].st && data.op - data.st > num - this.layers[i].st) {
          this.buildItem(i);
        }
      }
      this.completeLayers = this.elements[i] ? this.completeLayers : false;
    }
    this.checkPendingElements();
  }

  createItem(layer) {
    switch (layer.ty) {
      case 2:
        return this.createImage(layer);
      case 0:
        return this.createComp(layer);
      case 1:
        return this.createSolid(layer);
      case 3:
        return this.createNull(layer);
      case 4:
        return this.createShape(layer);
      case 5:
        return this.createText(layer);
      case 6:
        return this.createAudio(layer);
      case 13:
        return this.createCamera(layer);
      case 15:
        return this.createFootage(layer);
      default:
        return this.createNull(layer);
    }
  }

  createCamera() {
    throw new Error("You're using a 3d camera. Try the html renderer.");
  }

  createAudio(data) {
    return new AudioElement(data, this.globalData, this);
  }

  createFootage(data) {
    return new FootageElement(data, this.globalData, this);
  }

  buildAllItems() {
    let i;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      this.buildItem(i);
    }
    this.checkPendingElements();
  }

  includeLayers(newLayers) {
    this.completeLayers = false;
    let i;
    const len = newLayers.length;
    let j;
    const jLen = this.layers.length;
    for (i = 0; i < len; i += 1) {
      j = 0;
      while (j < jLen) {
        if (this.layers[j].id === newLayers[i].id) {
          this.layers[j] = newLayers[i];
          break;
        }
        j += 1;
      }
    }
  }

  setProjectInterface(pInterface) {
    this.globalData.projectInterface = pInterface;
  }

  initItems() {
    if (!this.globalData.progressiveLoad) {
      this.buildAllItems();
    }
  }

  buildElementParenting(element, parentName, hierarchy) {
    const elements = this.elements;
    const layers = this.layers;
    let i = 0;
    const len = layers.length;
    while (i < len) {
      if (layers[i].ind == parentName) {
        // eslint-disable-line eqeqeq
        if (!elements[i] || elements[i] === true) {
          this.buildItem(i);
          this.addPendingElement(element);
        } else {
          hierarchy.push(elements[i]);
          elements[i].setAsParent();
          if (layers[i].parent !== undefined) {
            this.buildElementParenting(element, layers[i].parent, hierarchy);
          } else {
            element.setHierarchy(hierarchy);
          }
        }
      }
      i += 1;
    }
  }

  addPendingElement(element) {
    this.pendingElements.push(element);
  }

  searchExtraCompositions(assets) {
    let i;
    const len = assets.length;
    for (i = 0; i < len; i += 1) {
      if (assets[i].xt) {
        const comp = this.createComp(assets[i]);
        comp.initExpressions();
        this.globalData.projectInterface.registerComposition(comp);
      }
    }
  }

  getElementById(ind) {
    let i;
    const len = this.elements.length;
    for (i = 0; i < len; i += 1) {
      if (this.elements[i].data.ind === ind) {
        return this.elements[i];
      }
    }
    return null;
  }

  getElementByPath(path) {
    const pathValue = path.shift();
    let element;
    if (typeof pathValue === 'number') {
      element = this.elements[pathValue];
    } else {
      let i;
      const len = this.elements.length;
      for (i = 0; i < len; i += 1) {
        if (this.elements[i].data.nm === pathValue) {
          element = this.elements[i];
          break;
        }
      }
    }
    if (path.length === 0) {
      return element;
    }
    return element.getElementByPath(path);
  }

  setupGlobalData(animData, fontsContainer) {
    this.globalData.fontManager = new FontManager();
    this.globalData.slotManager = slotFactory(animData);
    this.globalData.fontManager.addChars(animData.chars);
    this.globalData.fontManager.addFonts(animData.fonts, fontsContainer);
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.imageLoader = this.animationItem.imagePreloader;
    this.globalData.audioController = this.animationItem.audioController;
    this.globalData.frameId = 0;
    this.globalData.frameRate = animData.fr;
    this.globalData.nm = animData.nm;
    this.globalData.compSize = {
      w: animData.w,
      h: animData.h,
    };
  }
}

export default BaseRenderer;
