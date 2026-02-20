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

function DynamicPropertyContainer(this: DynamicPropertyContainerMixin) {}

DynamicPropertyContainer.prototype = {
  addDynamicProperty(this: DynamicPropertyContainerMixin, prop: DynamicProperty) {
    if (this.dynamicProperties.indexOf(prop) === -1) {
      this.dynamicProperties.push(prop);
      this.container.addDynamicProperty(this);
      this._isAnimated = true;
    }
  },
  iterateDynamicProperties(this: DynamicPropertyContainerMixin) {
    this._mdf = false;
    let i: number;
    const len = this.dynamicProperties.length;
    for (i = 0; i < len; i += 1) {
      this.dynamicProperties[i].getValue();
      if (this.dynamicProperties[i]._mdf) {
        this._mdf = true;
      }
    }
  },
  initDynamicPropertyContainer(
    this: DynamicPropertyContainerMixin,
    container: DynamicPropertyContainerMixin['container'],
  ) {
    this.container = container;
    this.dynamicProperties = [];
    this._mdf = false;
    this._isAnimated = false;
  },
};

export default DynamicPropertyContainer;
export type { DynamicProperty, DynamicPropertyContainerMixin };
