import { Howl } from 'howler';

interface AudioItem {
  pause(): void;
  resume(): void;
  setRate(rate: number): void;
  volume(vol: number): void;
}

type AudioFactory = (path: string) => AudioItem;

class AudioController {
  audios: AudioItem[] = [];
  audioFactory: AudioFactory | null = null;
  _volume = 1;
  _isMuted = false;

  constructor(audioFactory?: AudioFactory) {
    this.audioFactory = audioFactory ?? null;
  }

  addAudio(audio: AudioItem) {
    this.audios.push(audio);
  }

  pause() {
    let i: number;
    const len = this.audios.length;
    for (i = 0; i < len; i += 1) {
      this.audios[i].pause();
    }
  }

  resume() {
    let i: number;
    const len = this.audios.length;
    for (i = 0; i < len; i += 1) {
      this.audios[i].resume();
    }
  }

  setRate(rateValue: number) {
    let i: number;
    const len = this.audios.length;
    for (i = 0; i < len; i += 1) {
      this.audios[i].setRate(rateValue);
    }
  }

  createAudio(assetPath: string): AudioItem {
    if (this.audioFactory) {
      return this.audioFactory(assetPath);
    }
    return new Howl({
      src: [assetPath],
    }) as unknown as AudioItem;
  }

  setAudioFactory(audioFactory: AudioFactory) {
    this.audioFactory = audioFactory;
  }

  setVolume(value: number) {
    this._volume = value;
    this._updateVolume();
  }

  mute() {
    this._isMuted = true;
    this._updateVolume();
  }

  unmute() {
    this._isMuted = false;
    this._updateVolume();
  }

  getVolume(): number {
    return this._volume;
  }

  _updateVolume() {
    let i: number;
    const len = this.audios.length;
    for (i = 0; i < len; i += 1) {
      this.audios[i].volume(this._volume * (this._isMuted ? 0 : 1));
    }
  }
}

function audioControllerFactory(): AudioController {
  return new AudioController();
}

export default audioControllerFactory;
