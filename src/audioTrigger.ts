export interface AudioTrigger {
  trigger: (unmuted: boolean) => boolean,
  audioBuffer: AudioBuffer
};

export async function create(file: string): Promise<AudioTrigger> {
  const audioBuffer = await fetch(file)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => (new window.AudioContext).decodeAudioData(arrayBuffer))
    .catch(error => { alert(error); throw error; })


  const trigger = (unmuted: boolean): boolean => {
    if (!audioBuffer || !unmuted) return false;

    const context = new window.AudioContext;
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(0);
    return true;
  };

  return { trigger, audioBuffer };
};
