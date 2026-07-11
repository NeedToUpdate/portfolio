import {
  generateParticles,
  type CloudSpec,
  type ParticleBuffers,
} from "./particles";

// Dedicated worker: builds the packed particle buffers off the main
// thread, so the ~20k-particle generation never lands in the page's
// blocking time. The typed arrays transfer back zero-copy.
const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<CloudSpec[]>) => {
  const p: ParticleBuffers = generateParticles(e.data);
  ctx.postMessage(p, [
    p.position.buffer,
    p.data.buffer,
    p.cloud.buffer,
    p.color.buffer,
    p.motion.buffer,
    p.angle.buffer,
    p.roles.buffer,
  ]);
};
