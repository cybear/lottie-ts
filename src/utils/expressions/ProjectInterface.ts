/* eslint-disable @typescript-eslint/no-explicit-any -- project composition registry */
const ProjectInterface = (function () {
  function registerComposition(this: any, comp: any) {
    this.compositions.push(comp);
  }

  return function () {
    function _thisProjectFunction(this: any, name: string) {
      let i = 0;
      const len = this.compositions.length;
      while (i < len) {
        if (this.compositions[i].data && this.compositions[i].data.nm === name) {
          if (this.compositions[i].prepareFrame && this.compositions[i].data.xt) {
            this.compositions[i].prepareFrame(this.currentFrame);
          }
          return this.compositions[i].compInterface;
        }
        i += 1;
      }
      return null;
    }

    _thisProjectFunction.compositions = [] as any[];
    _thisProjectFunction.currentFrame = 0;

    _thisProjectFunction.registerComposition = registerComposition;

    return _thisProjectFunction;
  };
})();

export default ProjectInterface;
