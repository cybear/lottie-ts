import { extendPrototype } from '../utils/functionExtensions';
import PropertyFactory from '../utils/PropertyFactory';
import type { AudioControllerLike, AudioLayerData, GlobalData } from '../types/lottieRuntime';
import RenderableElement from './helpers/RenderableElement';
import BaseElement from './BaseElement';
import FrameElement from './helpers/FrameElement';

/** Time remap from `PropertyFactory` or a stand-in when absent. */
type TimeRemapProp = { _placeholder: true } | { _placeholder?: false; v: number };

/** Level property (`lv`) — first channel used as volume scalar. */
type LevelProp = { v: number[] };

class AudioElement {
  declare initFrame: () => void;
  declare initRenderable: () => void;
  declare initBaseData: (data: AudioLayerData, globalData: GlobalData, comp: unknown) => void;
  declare prepareRenderableFrame: (num: number, isVisible: boolean) => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;
  declare isInRange: boolean;
  declare globalData: GlobalData;
  declare data: AudioLayerData;

  assetData: unknown;
  audio: ReturnType<AudioControllerLike['createAudio']>;
  _isPlaying: boolean;
  _canPlay: boolean;
  _currentTime: number;
  _volumeMultiplier: number;
  _volume: number;
  _previousVolume: number | null;
  tm: TimeRemapProp;
  lv: LevelProp;

  constructor(data: AudioLayerData, globalData: GlobalData, comp: unknown) {
    this.initFrame();
    this.initRenderable();
    this.assetData = globalData.getAssetData!(data.refId);
    this.initBaseData(data, globalData, comp);
    this._isPlaying = false;
    this._canPlay = false;
    const assetPath = globalData.getAssetsPath!(this.assetData);
    const audioController = globalData.audioController as AudioControllerLike;
    this.audio = audioController.createAudio(assetPath);
    this._currentTime = 0;
    audioController.addAudio(this);
    this._volumeMultiplier = 1;
    this._volume = 1;
    this._previousVolume = null;
    this.tm = data.tm
      ? (PropertyFactory.getProp(this, data.tm, 0, globalData.frameRate!, this) as TimeRemapProp)
      : { _placeholder: true };
    this.lv = PropertyFactory.getProp(
      this,
      data.au && data.au.lv ? data.au.lv : { k: [100] },
      1,
      0.01,
      this,
    ) as LevelProp;
  }

  prepareFrame(num: number) {
    this.prepareRenderableFrame(num, true);
    this.prepareProperties(num, true);
    if (!('_placeholder' in this.tm) || !this.tm._placeholder) {
      const timeRemapped = (this.tm as { v: number }).v;
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
        this.audio.seek(this._currentTime / this.globalData.frameRate!);
        this._isPlaying = true;
      } else if (
        !this.audio.playing() ||
        Math.abs(this._currentTime / this.globalData.frameRate! - (this.audio.seek() as number)) > 0.1
      ) {
        this.audio.seek(this._currentTime / this.globalData.frameRate!);
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

  setRate(rateValue: number) {
    this.audio.rate(rateValue);
  }

  volume(volumeValue: number) {
    this._volumeMultiplier = volumeValue;
    this._previousVolume = volumeValue * this._volume;
    this.audio.volume(this._previousVolume);
  }

  getBaseElement(): null {
    return null;
  }

  destroy() {}

  sourceRectAtTime() {}

  initExpressions() {}
}

const audioSourceRectAtTime = AudioElement.prototype.sourceRectAtTime;
const audioInitExpressions = AudioElement.prototype.initExpressions;

extendPrototype([RenderableElement, BaseElement, FrameElement], AudioElement);

AudioElement.prototype.sourceRectAtTime = audioSourceRectAtTime;
AudioElement.prototype.initExpressions = audioInitExpressions;

export default AudioElement;
