interface AudioData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// TODO: fix Overwrite
function AudioElement(this: { audioData: AudioData }, data: AudioData) {
  this.audioData = data;
}

export default AudioElement;
