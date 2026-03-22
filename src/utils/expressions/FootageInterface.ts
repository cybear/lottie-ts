/* eslint-disable @typescript-eslint/no-explicit-any -- nested footage data walk */
const FootageInterface = (function () {
  const outlineInterfaceFactory = function (elem: any) {
    let currentPropertyName = '';
    let currentProperty = elem.getFootageData();
    function init() {
      currentPropertyName = '';
      currentProperty = elem.getFootageData();
      return searchProperty;
    }
    const searchProperty: any = function (value: string) {
      if (currentProperty[value]) {
        currentPropertyName = value;
        currentProperty = currentProperty[value];
        if (typeof currentProperty === 'object') {
          return searchProperty;
        }
        return currentProperty;
      }
      const propertyNameIndex = value.indexOf(currentPropertyName);
      if (propertyNameIndex !== -1) {
        const index = parseInt(value.substr(propertyNameIndex + currentPropertyName.length), 10);
        currentProperty = currentProperty[index];
        if (typeof currentProperty === 'object') {
          return searchProperty;
        }
        return currentProperty;
      }
      return '';
    };
    return init;
  };

  const dataInterfaceFactory = function (elem: any) {
    const interfaceFunction: any = function (value: string) {
      if (value === 'Outline') {
        return interfaceFunction.outlineInterface();
      }
      return null;
    };

    interfaceFunction._name = 'Outline';
    interfaceFunction.outlineInterface = outlineInterfaceFactory(elem);
    return interfaceFunction;
  };

  return function (elem: any) {
    const _interfaceFunction: any = function (value: string) {
      if (value === 'Data') {
        return _interfaceFunction.dataInterface;
      }
      return null;
    };

    _interfaceFunction._name = 'Data';
    _interfaceFunction.dataInterface = dataInterfaceFactory(elem);
    return _interfaceFunction;
  };
})();

export default FootageInterface;
