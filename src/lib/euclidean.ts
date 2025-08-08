export function euclidean(k: number, n: number): number[] {
  let pulses: number[][] = Array(k).fill([1]);
  let rests: number[][] = Array(Math.max(0, n - k)).fill([0]);
  while (rests.length > 0) {
    const minLen = Math.min(pulses.length, rests.length);
    for (let i = 0; i < minLen; i++) {
      pulses[i] = pulses[i].concat(rests[i]);
    }
    rests = rests.slice(minLen);
    if (rests.length === 0) break;
    const temp = pulses.slice(minLen);
    pulses = pulses.slice(0, minLen);
    rests = rests.concat(temp);
  }
  return pulses.flat();
}
