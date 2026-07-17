export const AUDIO_WARMUP_TIMEOUT_MS = 3000;

/**
 * WebKit dapat meninggalkan promise audio (AudioContext.resume / HTMLAudioElement.play)
 * pending tanpa pernah settle, yang mengunci UI tanpa memunculkan error apa pun.
 * Batasi agar kegagalan selalu terlihat dan tidak pernah menggantung selamanya.
 */
export const withTimeout = async <T>(
  task: Promise<T>,
  label: string,
  timeoutMs: number = AUDIO_WARMUP_TIMEOUT_MS
): Promise<T> => {
  let timer: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = window.setTimeout(
      () => reject(new Error(`${label} tidak merespons dalam ${timeoutMs}ms.`)),
      timeoutMs
    );
  });
  try {
    return await Promise.race([task, timeout]);
  } finally {
    window.clearTimeout(timer);
  }
};
