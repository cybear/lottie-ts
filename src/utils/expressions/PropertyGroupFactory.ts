/* eslint-disable @typescript-eslint/no-explicit-any -- expression property group nesting */
const propertyGroupFactory = (function () {
  return function (interfaceFunction: any, parentPropertyGroup: any) {
    return function (val?: number) {
      val = val === undefined ? 1 : val;
      if (val <= 0) {
        return interfaceFunction;
      }
      return parentPropertyGroup(val - 1);
    };
  };
})();

export default propertyGroupFactory;
