/* eslint-disable @typescript-eslint/no-explicit-any -- worker: replaces AnimationItem prototype methods */
import AnimationItem from './AnimationItem';
import CanvasRenderer from '../renderers/CanvasRenderer';
import dataManager from '../utils/DataManager';
import { getExpressionsPlugin } from '../utils/common';

(AnimationItem.prototype as any).setParams = function (this: any, params: any) {
  if (params.context) {
    this.context = params.context;
  }
  let animType = 'svg';
  if (params.animType) {
    animType = params.animType;
  } else if (params.renderer) {
    animType = params.renderer;
  }
  switch (animType) {
    case 'canvas':
      this.renderer = new CanvasRenderer(this, params.rendererSettings);
      break;
    default:
      throw new Error('Only canvas renderer is supported when using worker.');
  }
  this.renderer.setProjectInterface(this.projectInterface);
  this.animType = animType;

  if (params.loop === '' || params.loop === null || params.loop === undefined || params.loop === true) {
    this.loop = true;
  } else if (params.loop === false) {
    this.loop = false;
  } else {
    this.loop = parseInt(params.loop, 10);
  }
  this.autoplay = 'autoplay' in params ? params.autoplay : true;
  this.name = params.name ? params.name : '';
  this.autoloadSegments = Object.prototype.hasOwnProperty.call(params, 'autoloadSegments')
    ? params.autoloadSegments
    : true;
  this.assetsPath = null;
  if (params.animationData) {
    dataManager.completeAnimation(params.animationData, this.configAnimation, undefined);
  } else if (params.path) {
    throw new Error('Canvas worker renderer cannot load animation from url');
  }
};

(AnimationItem.prototype as any).setData = function (this: any) {
  throw new Error('Cannot set data on wrapper for canvas worker renderer');
};

(AnimationItem.prototype as any).includeLayers = function (this: any, data: any) {
  if (data.op > this.animationData.op) {
    this.animationData.op = data.op;
    this.totalFrames = Math.floor(data.op - this.animationData.ip);
  }
  const layers = this.animationData.layers;
  let i;
  const len = layers.length;
  const newLayers = data.layers;
  let j;
  const jLen = newLayers.length;
  for (j = 0; j < jLen; j += 1) {
    i = 0;
    while (i < len) {
      if (layers[i].id === newLayers[j].id) {
        layers[i] = newLayers[j];
        break;
      }
      i += 1;
    }
  }
  this.animationData.__complete = false;
  dataManager.completeAnimation(this.animationData, this.configAnimation, undefined);
  this.renderer.includeLayers(data.layers);
  const expressionsPlugin = getExpressionsPlugin();
  if (expressionsPlugin) {
    expressionsPlugin.initExpressions(this);
  }
  this.loadNextSegment();
};

(AnimationItem.prototype as any).loadNextSegment = function (this: any) {
  const segments = this.animationData.segments;
  if (!segments || segments.length === 0 || !this.autoloadSegments) {
    this.timeCompleted = this.totalFrames;
    return;
  }
  throw new Error('Cannot load multiple segments in worker.');
};

(AnimationItem.prototype as any).loadSegments = function (this: any) {
  const segments = this.animationData.segments;
  if (!segments) {
    this.timeCompleted = this.totalFrames;
  }
  this.loadNextSegment();
};

(AnimationItem.prototype as any).imagesLoaded = null;

(AnimationItem.prototype as any).preloadImages = null;

(AnimationItem.prototype as any).configAnimation = function (this: any, animData: any) {
  if (!this.renderer) {
    return;
  }
  this.animationData = animData;
  this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip);
  this.renderer.configAnimation(animData);
  if (!animData.assets) {
    animData.assets = [];
  }
  this.renderer.searchExtraCompositions(animData.assets);

  this.assets = this.animationData.assets;
  this.frameRate = this.animationData.fr;
  this.firstFrame = Math.round(this.animationData.ip);
  this.frameMult = this.animationData.fr / 1000;
  this.loadSegments();
  this.updaFrameModifier();
  this.checkLoaded();
};

(AnimationItem.prototype as any).waitForFontsLoaded = null;

(AnimationItem.prototype as any).checkLoaded = function (this: any) {
  if (!this.isLoaded) {
    this.isLoaded = true;
    const expressionsPlugin = getExpressionsPlugin();
    if (expressionsPlugin) {
      expressionsPlugin.initExpressions(this);
    }
    this.renderer.initItems();
    this.gotoFrame();
  }
};

(AnimationItem.prototype as any).destroy = function (this: any, name: any) {
  if ((name && this.name !== name) || !this.renderer) {
    return;
  }
  this.renderer.destroy();
  this._cbs = null;
  this.onEnterFrame = null;
  this.onLoopComplete = null;
  this.onComplete = null;
  this.onSegmentStart = null;
  this.onDestroy = null;
  this.renderer = null;
};

(AnimationItem.prototype as any).getPath = null;
