/**
 * @file
 * Handles element's layer frame update.
 * Checks layer in point and out point
 *
 */

import type { GlobalData, LayerDynamicProperty } from '../../types/lottieRuntime';

class FrameElement {
  _isFirstFrame!: boolean;
  dynamicProperties!: LayerDynamicProperty[];
  _mdf!: boolean;
  globalData!: GlobalData;
  _isParent?: boolean;

  /**
   * @function
   * Initializes frame related properties.
   *
   */
  initFrame() {
    // set to true when inpoint is rendered
    this._isFirstFrame = false;
    // list of animated properties
    this.dynamicProperties = [];
    // If layer has been modified in current tick this will be true
    this._mdf = false;
  }

  /**
   * @function
   * Calculates all dynamic values
   *
   * @param {number} num
   * current frame number in Layer's time
   * @param {boolean} isVisible
   * if layers is currently in range
   *
   */
  prepareProperties(num: number, isVisible: boolean) {
    let i;
    const len = this.dynamicProperties.length;
    for (i = 0; i < len; i += 1) {
      if (isVisible || (this._isParent && this.dynamicProperties[i].propType === 'transform')) {
        this.dynamicProperties[i].getValue();
        if (this.dynamicProperties[i]._mdf) {
          this.globalData._mdf = true;
          this._mdf = true;
        }
      }
    }
  }

  addDynamicProperty(prop: LayerDynamicProperty) {
    if (this.dynamicProperties.indexOf(prop) === -1) {
      this.dynamicProperties.push(prop);
    }
  }
}

export default FrameElement;
