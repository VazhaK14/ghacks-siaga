import { cn } from "@siaga-app/ui/lib/utils";
import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  active: boolean;
  audioElement?: HTMLAudioElement | null;
  audioEnvelope?: readonly number[] | null;
  className?: string;
  label: string;
  mediaStream?: MediaStream | null;
}

const BAR_COUNT = 20;
const FFT_SIZE = 128;
const MIN_BAR_HEIGHT = 6;
const BAR_GAP = 6;
const SYNTHETIC_SPEED = 0.004;

const getSyntheticLevel = (
  barIndex: number,
  timestamp: number,
  active: boolean
): number => {
  const phase = timestamp * SYNTHETIC_SPEED + barIndex * 0.64;
  const wave = (Math.sin(phase) + Math.sin(phase * 0.53 + 1.7) + 2) / 4;
  return active ? 0.22 + wave * 0.52 : 0.08 + wave * 0.08;
};

const getBarLevel = (
  barIndex: number,
  frequencyData: Uint8Array<ArrayBuffer> | null,
  audioElement: HTMLAudioElement | null,
  audioEnvelope: readonly number[] | null,
  timestamp: number,
  active: boolean
): number => {
  if (frequencyData) {
    const frequencyIndex = Math.floor(
      (barIndex / BAR_COUNT) * frequencyData.length
    );
    return Math.max(0.08, (frequencyData[frequencyIndex] ?? 0) / 255);
  }
  if (
    audioElement &&
    audioEnvelope &&
    audioEnvelope.length > 0 &&
    Number.isFinite(audioElement.duration) &&
    audioElement.duration > 0
  ) {
    const progress = audioElement.currentTime / audioElement.duration;
    const centerIndex = Math.floor(progress * (audioEnvelope.length - 1));
    const sampleOffset = barIndex - Math.floor(BAR_COUNT / 2);
    const sampleIndex = Math.min(
      audioEnvelope.length - 1,
      Math.max(0, centerIndex + sampleOffset)
    );
    return audioEnvelope[sampleIndex] ?? 0.08;
  }
  return getSyntheticLevel(barIndex, timestamp, active);
};

export const AudioWaveform = ({
  active,
  audioElement = null,
  audioEnvelope = null,
  className,
  label,
  mediaStream = null,
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const { color } = getComputedStyle(canvas);
    let animationFrameId = 0;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let sourceNode: AudioNode | null = null;
    let frequencyData: Uint8Array<ArrayBuffer> | null = null;

    if (active && mediaStream) {
      try {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.82;
        audioContext.resume().catch(() => undefined);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        sourceNode.connect(analyser);
      } catch {
        sourceNode = null;
        analyser = null;
        frequencyData = null;
      }
    }

    const draw = (timestamp: number): void => {
      const { devicePixelRatio = 1 } = window;
      const { height, width } = canvas.getBoundingClientRect();
      const pixelWidth = Math.max(1, Math.round(width * devicePixelRatio));
      const pixelHeight = Math.max(1, Math.round(height * devicePixelRatio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      if (analyser && frequencyData) {
        analyser.getByteFrequencyData(frequencyData);
      }

      const availableWidth = width - BAR_GAP * (BAR_COUNT - 1);
      const barWidth = Math.max(3, availableWidth / BAR_COUNT);
      const waveformWidth = barWidth * BAR_COUNT + BAR_GAP * (BAR_COUNT - 1);
      const startX = (width - waveformWidth) / 2;
      context.fillStyle = color;

      for (let barIndex = 0; barIndex < BAR_COUNT; barIndex += 1) {
        const position = barIndex / (BAR_COUNT - 1);
        const envelope = 0.38 + Math.sin(Math.PI * position) * 0.62;
        const rawLevel = prefersReducedMotion
          ? 0.18
          : getBarLevel(
              barIndex,
              frequencyData,
              audioElement,
              audioEnvelope,
              timestamp,
              active
            );
        const barHeight = Math.max(
          MIN_BAR_HEIGHT,
          rawLevel * height * envelope
        );
        const x = startX + barIndex * (barWidth + BAR_GAP);
        const y = (height - barHeight) / 2;
        context.globalAlpha = 0.3 + envelope * 0.45;
        context.beginPath();
        context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        context.fill();
      }
      context.globalAlpha = 1;
      animationFrameId = window.requestAnimationFrame(draw);
    };

    animationFrameId = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      sourceNode?.disconnect();
      analyser?.disconnect();
      audioContext?.close().catch(() => undefined);
    };
  }, [active, audioElement, audioEnvelope, mediaStream]);

  return (
    <canvas
      aria-label={label}
      className={cn("h-36 w-full text-primary", className)}
      ref={canvasRef}
      role="img"
    />
  );
};
