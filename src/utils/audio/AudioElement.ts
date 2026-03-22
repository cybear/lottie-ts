interface AudioData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// TODO: fix Overwrite
class AudioElement {
  audioData: AudioData;

  constructor(data: AudioData) {
    this.audioData = data;
  }
}

export default AudioElement;
