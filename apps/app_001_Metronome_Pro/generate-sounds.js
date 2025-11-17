// Simple script to generate metronome click sounds
const fs = require('fs');

// Generate a simple WAV file with a beep tone
function generateBeep(frequency, duration, filename) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const amplitude = 0.3;

  // Create WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(1, 22); // number of channels
  header.writeUInt32LE(sampleRate, 24); // sample rate
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40);

  // Generate audio data (simple sine wave)
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    const value = Math.floor(sample * 32767);
    data.writeInt16LE(value, i * 2);
  }

  // Combine header and data
  const wav = Buffer.concat([header, data]);
  fs.writeFileSync(filename, wav);
  console.log(`Generated ${filename}`);
}

// Generate click sound (higher frequency, short duration)
generateBeep(1000, 0.05, './assets/sounds/click.wav');

// Generate accent sound (higher frequency and volume)
generateBeep(1200, 0.05, './assets/sounds/accent.wav');

console.log('Sound files generated successfully!');
