// import { Howl } from 'howler'; // ready to enable — package installed, vendored copy removed

interface AudioItem {
  pause(): void;
  resume(): void;
  setRate(rate: number): void;
  volume(vol: number): void;
}

type AudioFactory = (path: string) => AudioItem;

interface AudioControllerThis {
  audios: AudioItem[];
  audioFactory: AudioFactory | null;
  _volume: number;
  _isMuted: boolean;
  _updateVolume(): void;
}

const audioControllerFactory = (function () {
  function AudioController(this: AudioControllerThis, audioFactory?: AudioFactory) {
    this.audios = [];
    this.audioFactory = audioFactory ?? null;
    this._volume = 1;
    this._isMuted = false;
  }

  AudioController.prototype = {
    addAudio(this: AudioControllerThis, audio: AudioItem) {
      this.audios.push(audio);
    },
    pause(this: AudioControllerThis) {
      let i: number;
      const len = this.audios.length;
      for (i = 0; i < len; i += 1) {
        this.audios[i].pause();
      }
    },
    resume(this: AudioControllerThis) {
      let i: number;
      const len = this.audios.length;
      for (i = 0; i < len; i += 1) {
        this.audios[i].resume();
      }
    },
    setRate(this: AudioControllerThis, rateValue: number) {
      let i: number;
      const len = this.audios.length;
      for (i = 0; i < len; i += 1) {
        this.audios[i].setRate(rateValue);
      }
    },
    createAudio(this: AudioControllerThis, assetPath: string): AudioItem {
      if (this.audioFactory) {
        return this.audioFactory(assetPath);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Howl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (window as any).Howl({
          src: [assetPath],
        });
      }
      return {
        isPlaying: false,
        play() {
          (this as { isPlaying: boolean }).isPlaying = true;
        },
        seek() {
          (this as { isPlaying: boolean }).isPlaying = false;
        },
        playing() {},
        rate() {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setVolume(_vol: number) {},
        pause() {},
        resume() {},
        volume() {},
      } as unknown as AudioItem;
    },
    setAudioFactory(this: AudioControllerThis, audioFactory: AudioFactory) {
      this.audioFactory = audioFactory;
    },
    setVolume(this: AudioControllerThis, value: number) {
      this._volume = value;
      this._updateVolume();
    },
    mute(this: AudioControllerThis) {
      this._isMuted = true;
      this._updateVolume();
    },
    unmute(this: AudioControllerThis) {
      this._isMuted = false;
      this._updateVolume();
    },
    getVolume(this: AudioControllerThis): number {
      return this._volume;
    },
    _updateVolume(this: AudioControllerThis) {
      let i: number;
      const len = this.audios.length;
      for (i = 0; i < len; i += 1) {
        this.audios[i].volume(this._volume * (this._isMuted ? 0 : 1));
      }
    },
  };

  return function (): AudioControllerThis {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (AudioController as any)();
  };
})();

export default audioControllerFactory;
