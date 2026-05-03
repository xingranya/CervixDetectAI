import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sampleRate = 44100;
const durationSeconds = 20;
const totalSamples = sampleRate * durationSeconds;
const outDir = join(process.cwd(), "public", "audio");

mkdirSync(outDir, { recursive: true });

const clamp = (value) => Math.max(-1, Math.min(1, value));

const envelope = (t, start, attack, release, end = durationSeconds) => {
  if (t < start || t > end) {
    return 0;
  }
  const fadeIn = Math.min(1, (t - start) / attack);
  const fadeOut = Math.min(1, (end - t) / release);
  return Math.max(0, Math.min(fadeIn, fadeOut));
};

const kick = (t, beatTime) => {
  const x = t - beatTime;
  if (x < 0 || x > 0.18) {
    return 0;
  }
  const freq = 92 - x * 260;
  return Math.sin(2 * Math.PI * freq * x) * Math.exp(-x * 18);
};

const hat = (t, beatTime) => {
  const x = t - beatTime;
  if (x < 0 || x > 0.055) {
    return 0;
  }
  const noise = Math.sin(2 * Math.PI * 7340 * x) * Math.sin(2 * Math.PI * 1270 * x);
  return noise * Math.exp(-x * 58);
};

const writeWav = (filename, samples, volume = 1) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    buffer.writeInt16LE(Math.round(clamp(sample * volume) * 32767), 44 + index * 2);
  });

  writeFileSync(join(outDir, filename), buffer);
};

const music = new Float32Array(totalSamples);
const bpm = 118;
const beat = 60 / bpm;
const chords = [
  [146.83, 220, 293.66],
  [164.81, 246.94, 329.63],
  [130.81, 196, 261.63],
  [174.61, 261.63, 349.23],
];

for (let i = 0; i < totalSamples; i += 1) {
  const t = i / sampleRate;
  const chord = chords[Math.floor(t / 5) % chords.length];
  const rise = 0.72 + t / durationSeconds * 0.45;
  const sidechain = 0.78 + 0.22 * Math.sin((2 * Math.PI * t) / beat);
  let value = 0;

  chord.forEach((freq, index) => {
    value += Math.sin(2 * Math.PI * freq * rise * t + index * 0.7) * (0.09 / (index + 1));
    value += Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.025;
  });

  value += Math.sin(2 * Math.PI * (42 + Math.sin(t * 0.7) * 3) * t) * 0.14;
  value += Math.sin(2 * Math.PI * (880 + t * 34) * t) * envelope(t, 2, 3, 4) * 0.025;

  for (let b = 0; b < durationSeconds / beat; b += 1) {
    const beatTime = b * beat;
    value += kick(t, beatTime) * 0.36;
    value += hat(t, beatTime + beat / 2) * 0.04;
  }

  const master = Math.min(1, t / 1.2) * Math.min(1, (durationSeconds - t) / 1.5);
  music[i] = value * sidechain * master;
}

writeWav("business-bed.wav", music, 0.72);

const createSfx = (filename, seconds, render, volume = 1) => {
  const samples = new Float32Array(Math.floor(sampleRate * seconds));
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = render(i / sampleRate);
  }
  writeWav(filename, samples, volume);
};

createSfx(
  "scan-sweep.wav",
  1.1,
  (t) => Math.sin(2 * Math.PI * (420 + t * 900) * t) * Math.exp(-t * 2.8) * Math.min(1, t / 0.08),
  0.22,
);

createSfx(
  "lock.wav",
  0.42,
  (t) =>
    (Math.sin(2 * Math.PI * 960 * t) * Math.exp(-t * 18) +
      Math.sin(2 * Math.PI * 1440 * t) * Math.exp(-Math.max(0, t - 0.08) * 22)) *
    Math.min(1, t / 0.025),
  0.25,
);

createSfx(
  "whoosh.wav",
  0.72,
  (t) => Math.sin(2 * Math.PI * (180 + t * 520) * t) * Math.sin(Math.PI * t / 0.72) ** 2,
  0.18,
);

createSfx(
  "report-ding.wav",
  0.85,
  (t) =>
    (Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 4.8) +
      Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 6.2)) *
    Math.min(1, t / 0.02),
  0.2,
);

console.log("Generated music and SFX in public/audio");
