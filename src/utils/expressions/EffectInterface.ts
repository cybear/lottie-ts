/* eslint-disable @typescript-eslint/no-explicit-any -- effect tree proxies for expressions */
import ExpressionPropertyInterface from './ExpressionValueFactory';
import propertyGroupFactory from './PropertyGroupFactory';
import PropertyInterface from './PropertyInterface';

const EffectsExpressionInterface = (function () {
  const ob = {
    createEffectsInterface: createEffectsInterface,
  };

  function createEffectsInterface(elem: any, propertyGroup: any) {
    if (elem.effectsManager) {
      const effectElements: any[] = [];
      const effectsData = elem.data.ef;
      let i;
      let len = elem.effectsManager.effectElements.length;
      for (i = 0; i < len; i += 1) {
        effectElements.push(
          createGroupInterface(effectsData[i], elem.effectsManager.effectElements[i], propertyGroup, elem),
        );
      }

      const effects = elem.data.ef || [];
      const groupInterface: any = function (name: string | number) {
        i = 0;
        len = effects.length;
        while (i < len) {
          if (name === effects[i].nm || name === effects[i].mn || name === effects[i].ix) {
            return effectElements[i];
          }
          i += 1;
        }
        return null;
      };
      Object.defineProperty(groupInterface, 'numProperties', {
        get: function () {
          return effects.length;
        },
      });
      return groupInterface;
    }
    return null;
  }

  function createGroupInterface(data: any, elements: any, propertyGroup: any, elem: any) {
    const effectElements: any[] = [];
    const groupInterface: any = function (name: string | number) {
      const effects = data.ef;
      let i = 0;
      const len = effects.length;
      while (i < len) {
        if (name === effects[i].nm || name === effects[i].mn || name === effects[i].ix) {
          if (effects[i].ty === 5) {
            return effectElements[i];
          }
          return effectElements[i]();
        }
        i += 1;
      }
      throw new Error();
    };
    const _propertyGroup = propertyGroupFactory(groupInterface, propertyGroup);

    let i;
    const len = data.ef.length;
    for (i = 0; i < len; i += 1) {
      if (data.ef[i].ty === 5) {
        effectElements.push(
          createGroupInterface(data.ef[i], elements.effectElements[i], elements.effectElements[i].propertyGroup, elem),
        );
      } else {
        effectElements.push(createValueInterface(elements.effectElements[i], data.ef[i].ty, elem, _propertyGroup));
      }
    }

    if (data.mn === 'ADBE Color Control') {
      Object.defineProperty(groupInterface, 'color', {
        get: function () {
          return effectElements[0]();
        },
      });
    }
    Object.defineProperties(groupInterface, {
      numProperties: {
        get: function () {
          return data.np;
        },
      },
      _name: { value: data.nm },
      propertyGroup: { value: _propertyGroup },
    });
    groupInterface.enabled = data.en !== 0;
    groupInterface.active = groupInterface.enabled;
    return groupInterface;
  }

  function createValueInterface(element: any, type: number, elem: any, propertyGroup: any) {
    const expressionProperty = ExpressionPropertyInterface(element.p);
    function interfaceFunction() {
      if (type === 10) {
        return elem.comp.compInterface(element.p.v);
      }
      return expressionProperty();
    }

    if (element.p.setGroupProperty) {
      element.p.setGroupProperty(PropertyInterface('', propertyGroup));
    }

    return interfaceFunction;
  }

  return ob;
})();

export default EffectsExpressionInterface;
