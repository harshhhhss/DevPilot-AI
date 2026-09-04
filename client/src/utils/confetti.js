import confetti from 'canvas-confetti';

// Small celebratory burst — used when a task lands in Done, not for every action.
export function celebrate() {
  confetti({
    particleCount: 70,
    spread: 65,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: ['#2547ec', '#5c8dff', '#8db5ff', '#22c55e'],
    disableForReducedMotion: true,
  });
}
