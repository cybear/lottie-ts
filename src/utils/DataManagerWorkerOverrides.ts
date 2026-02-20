import dataManager from './DataManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(dataManager as any).completeData = function (animationData: any) {
  if (animationData.__complete) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self = dataManager as any;
  self.checkColors(animationData);
  self.checkChars(animationData);
  self.checkPathProperties(animationData);
  self.checkShapes(animationData);
  self.completeLayers(animationData.layers, animationData.assets);
  animationData.__complete = true;
};
