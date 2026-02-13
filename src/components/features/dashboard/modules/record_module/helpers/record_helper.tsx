import { Mp3Encoder } from "@breezystack/lamejs";

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const getSmartName = (source: "mic" | "system") => {
  const hour = new Date().getHours();
  const prefix = source === "mic" ? "Voice" : "System Audio";
  if (hour < 12) return `Morning ${prefix}`;
  if (hour < 18) return `Afternoon ${prefix}`;
  return `Evening ${prefix}`;
};

export const bufferToWave = (abuffer: AudioBuffer, len: number) => {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < len) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const bufferToMp3 = (buffer: AudioBuffer) => {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);

  const mp3Data: any[] = [];

  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;

  const sampleBlockSize = 1152;
  const dt = new Int16Array(left.length);
  const dt2 = new Int16Array(right.length);

  for (let i = 0; i < left.length; i++) {
    let s = Math.max(-1, Math.min(1, left[i]));
    dt[i] = s < 0 ? s * 0x8000 : s * 0x7fff;

    if (channels > 1) {
      let s2 = Math.max(-1, Math.min(1, right[i]));
      dt2[i] = s2 < 0 ? s2 * 0x8000 : s2 * 0x7fff;
    }
  }

  for (let i = 0; i < dt.length; i += sampleBlockSize) {
    const leftChunk = dt.subarray(i, i + sampleBlockSize);
    const rightChunk =
      channels > 1 ? dt2.subarray(i, i + sampleBlockSize) : undefined;

    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  return new Blob(mp3Data, { type: "audio/mp3" });
};
