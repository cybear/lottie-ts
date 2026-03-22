interface DynamicProperty {
  getValue(): void;
  _mdf: boolean;
}

interface DynamicPropertyContainerMixin {
  dynamicProperties: DynamicProperty[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any;
  _mdf: boolean;
  _isAnimated: boolean;
}

class DynamicPropertyContainer {
  declare dynamicProperties: DynamicProperty[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare container: any;
  declare _mdf: boolean;
  declare _isAnimated: boolean;

  addDynamicProperty(prop: DynamicProperty) {
    if (this.dynamicProperties.indexOf(prop) === -1) {
      this.dynamicProperties.push(prop);
      this.container.addDynamicProperty(this);
      this._isAnimated = true;
    }
  }

  iterateDynamicProperties() {
    this._mdf = false;
    let i: number;
    const len = this.dynamicProperties.length;
    for (i = 0; i < len; i += 1) {
      this.dynamicProperties[i].getValue();
      if (this.dynamicProperties[i]._mdf) {
        this._mdf = true;
      }
    }
  }

  initDynamicPropertyContainer(container: DynamicPropertyContainerMixin['container']) {
    this.container = container;
    this.dynamicProperties = [];
    this._mdf = false;
    this._isAnimated = false;
  }
}

export default DynamicPropertyContainer;
export type { DynamicProperty, DynamicPropertyContainerMixin };
