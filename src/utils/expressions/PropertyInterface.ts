/* eslint-disable @typescript-eslint/no-explicit-any -- minimal expression property shell */
const PropertyInterface = (function () {
  return function (propertyName: string, propertyGroup: any) {
    const interfaceFunction = {
      _name: propertyName,
    };

    function _propertyGroup(val?: number) {
      val = val === undefined ? 1 : val;
      if (val <= 0) {
        return interfaceFunction;
      }
      return propertyGroup(val - 1);
    }

    return _propertyGroup;
  };
})();

export default PropertyInterface;
