/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Play dual-tone professional bank queue chime using Web Audio API
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve();
        return;
      }

      const ctx = new AudioContext();
      
      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        // Quick attack, smooth exponential decay
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // F-chime chord (professional, warm & pleasing)
      const now = ctx.currentTime;
      playTone(523.25, now, 0.6, 0.12);        // C5
      playTone(659.25, now + 0.12, 0.8, 0.10); // E5
      playTone(783.99, now + 0.24, 1.0, 0.08); // G5
      playTone(1046.50, now + 0.36, 1.2, 0.06); // C6

      setTimeout(() => {
        ctx.close();
        resolve();
      }, 1500);
    } catch {
      resolve();
    }
  });
}

const digitMap: Record<string, string> = {
  '0': 'kosong',
  '1': 'satu',
  '2': 'dua',
  '3': 'tiga',
  '4': 'empat',
  '5': 'lima',
  '6': 'enam',
  '7': 'tujuh',
  '8': 'delapan',
  '9': 'sembilan'
};

// Pronounce the queue code and table in Indonesian
export function speakQueueId(nomor_antrian: string, jenis_layanan: 'kasir' | 'cs', nomor_meja: number): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Stop any current speaking to avoid overlaps
    synth.cancel();

    // Map service string to friendly Indonesian word
    const tipeLayananStr = jenis_layanan === 'kasir' ? 'kasir' : 'customer service';

    // Spell out letters
    let prefixSpelled = '';
    let numPart = '';

    if (nomor_antrian.startsWith('CS')) {
      prefixSpelled = 'C S';
      numPart = nomor_antrian.substring(2);
    } else if (nomor_antrian.startsWith('K')) {
      prefixSpelled = 'K';
      numPart = nomor_antrian.substring(1);
    } else {
      prefixSpelled = nomor_antrian.substring(0, 1);
      numPart = nomor_antrian.substring(1);
    }

    // Spell digits one by one
    const digitsSpelled = numPart
      .split('')
      .map((char) => digitMap[char] || char)
      .join(' ');

    const textToSpeak = `Nomor antrean ${prefixSpelled} ${digitsSpelled}, silakan menuju ke ${tipeLayananStr} meja ${nomor_meja}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85; // Slightly slower for crisp clear delivery
    utterance.pitch = 1.05;

    // Look for Indonesian local voice
    const voices = synth.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }

    synth.speak(utterance);
  } catch (error) {
    console.error('Error during TTS synthesis:', error);
  }
}
