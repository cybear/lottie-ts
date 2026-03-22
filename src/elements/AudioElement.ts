// @ts-nocheck
import { extendPrototype } from '../utils/functionExtensions';
import PropertyFactory from '../utils/PropertyFactory';
import RenderableElement from './helpers/RenderableElement';
import BaseElement from './BaseElement';
import FrameElement from './helpers/FrameElement';

class AudioElement {
  constructor(data, globalData, comp) {
    this.initFrame();
    this.initRenderable();
    this.assetData = globalData.getAssetData(data.refId);
    this.initBaseData(data, globalData, comp);
    this._isPlaying = false;
    this._canPlay = false;
    const assetPath = this.globalData.getAssetsPath(this.assetData);
    this.audio = this.globalData.audioController.createAudio(assetPath);
    this._currentTime = 0;
    this.globalData.audioController.addAudio(this);
    this._volumeMultiplier = 1;
    this._volume = 1;
    this._previousVolume = null;
    this.tm = data.tm ? PropertyFactory.getProp(this, data.tm, 0, globalData.frameRate, this) : { _placeholder: true };
    this.lv = PropertyFactory.getProp(this, data.au && data.au.lv ? data.au.lv : { k: [100] }, 1, 0.01, this);
  }

  prepareFrame(num) {
    this.prepareRenderableFrame(num, true);
    this.prepareProperties(num, true);
    if (!this.tm._placeholder) {
      const timeRemapped = this.tm.v;
      this._currentTime = timeRemapped;
    } else {
      this._currentTime = num / this.data.sr;
    }
    this._volume = this.lv.v[0];
    const totalVolume = this._volume * this._volumeMultiplier;
    if (this._previousVolume !== totalVolume) {
      this._previousVolume = totalVolume;
      this.audio.volume(totalVolume);
    }
  }

  renderFrame() {
    if (this.isInRange && this._canPlay) {
      if (!this._isPlaying) {
        this.audio.play();
        this.audio.seek(this._currentTime / this.globalData.frameRate);
        this._isPlaying = true;
      } else if (
        !this.audio.playing() ||
        Math.abs(this._currentTime / this.globalData.frameRate - this.audio.seek()) > 0.1
      ) {
        this.audio.seek(this._currentTime / this.globalData.frameRate);
      }
    }
  }

  show() {
    // this.audio.play()
  }

  hide() {
    this.audio.pause();
    this._isPlaying = false;
  }

  pause() {
    this.audio.pause();
    this._isPlaying = false;
    this._canPlay = false;
  }

  resume() {
    this._canPlay = true;
  }

  setRate(rateValue) {
    this.audio.rate(rateValue);
  }

  volume(volumeValue) {
    this._volumeMultiplier = volumeValue;
    this._previousVolume = volumeValue * this._volume;
    this.audio.volume(this._previousVolume);
  }

  getBaseElement() {
    return null;
  }

  destroy() {}
}

extendPrototype([RenderableElement, BaseElement, FrameElement], AudioElement);

AudioElement.prototype.sourceRectAtTime = function () {};

AudioElement.prototype.initExpressions = function () {};

export default AudioElement;
