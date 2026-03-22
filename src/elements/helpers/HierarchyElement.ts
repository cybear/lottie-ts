/**
 * @file
 * Handles AE's layer parenting property.
 *
 */

import type { LayerParentData, ParentingHost } from '../../types/lottieRuntime';

class HierarchyElement {
  hierarchy!: unknown[];
  _isParent!: boolean;
  data!: LayerParentData;
  comp!: ParentingHost;

  /**
   * @function
   * Initializes hierarchy properties
   *
   */
  initHierarchy() {
    // element's parent list
    this.hierarchy = [];
    // if element is parent of another layer _isParent will be true
    this._isParent = false;
    this.checkParenting();
  }

  /**
   * @function
   * Sets layer's hierarchy.
   * @param {array} hierarch
   * layer's parent list
   *
   */
  setHierarchy(hierarchy: unknown[]) {
    this.hierarchy = hierarchy;
  }

  /**
   * @function
   * Sets layer as parent.
   *
   */
  setAsParent() {
    this._isParent = true;
  }

  /**
   * @function
   * Searches layer's parenting chain
   *
   */
  checkParenting() {
    if (this.data.parent !== undefined) {
      this.comp.buildElementParenting(this, this.data.parent, []);
    }
  }
}

export default HierarchyElement;
