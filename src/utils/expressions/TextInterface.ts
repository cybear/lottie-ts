/* eslint-disable @typescript-eslint/no-explicit-any, no-new-wrappers -- text document proxy for AE expressions */
const TextExpressionInterface = (function () {
  return function (elem: any) {
    let _sourceText: any;
    const _thisLayerFunction: any = function (name: string) {
      switch (name) {
        case 'ADBE Text Document':
          return _thisLayerFunction.sourceText;
        default:
          return null;
      }
    };
    Object.defineProperty(_thisLayerFunction, 'sourceText', {
      get: function () {
        elem.textProperty.getValue();
        const stringValue = elem.textProperty.currentData.t;
        if (!_sourceText || stringValue !== _sourceText.value) {
          _sourceText = new String(stringValue);
          _sourceText.value = stringValue || new String(stringValue);
          Object.defineProperty(_sourceText, 'style', {
            get: function () {
              return {
                fillColor: elem.textProperty.currentData.fc,
              };
            },
          });
        }
        return _sourceText;
      },
    });
    return _thisLayerFunction;
  };
})();

export default TextExpressionInterface;
