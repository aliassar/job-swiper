/**
 * Mirror of job-swiper-server/src/lib/generation-state.ts.
 *
 * The server sends a `generation` object with each application, but the state
 * is time-dependent: a run that has been in flight for fifteen minutes counts
 * as failed. Re-deriving here means a card sitting on screen flips from
 * "Generating..." to "Failed" on its own, without waiting for a refetch.
 *
 * Keep the two in step if the rule changes.
 */

export const GENERATION_TIMEOUT_MS = 15 * 60 * 1000;
export const TIMEOUT_MESSAGE = 'No response from the generator after 15 minutes';

/**
 * Re-evaluate the server's verdict against the current clock.
 *
 * Only 'generating' can change: 'ready' and 'failed' are already settled, and
 * 'idle' means nothing was ever sent.
 */
export function resolveGenerationState(generation, now = Date.now()) {
  if (!generation) return { state: 'idle', startedAt: null, error: null };
  if (generation.state !== 'generating') return generation;

  const startedAt = generation.startedAt ? new Date(generation.startedAt).getTime() : null;
  if (startedAt && now - startedAt > GENERATION_TIMEOUT_MS) {
    return {
      state: 'failed',
      startedAt: generation.startedAt,
      error: generation.error ? `${TIMEOUT_MESSAGE} (${generation.error})` : TIMEOUT_MESSAGE,
    };
  }
  return generation;
}

/** How long the current attempt has been running, for the tooltip. */
export function formatElapsed(startedAt, now = Date.now()) {
  if (!startedAt) return null;
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}
