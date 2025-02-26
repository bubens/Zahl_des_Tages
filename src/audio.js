export async function createSound(file) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(file);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    const trigger = (unmuted) => {
      if (!audioBuffer || !unmuted) return; // Ensure the audio is loaded
  
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start(0); // Start immediately
      return true;
    };
  
    return { trigger, audioBuffer };
  }
  