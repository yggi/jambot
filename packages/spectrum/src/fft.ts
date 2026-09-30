/**
 * The fast Fourier transform, the window that goes before it, the magnitude
 * spectrum a frame of samples gives, and the autocorrelation the pitch
 * estimators read. Everything is on arrays of numbers, with no notion of
 * where the samples came from.
 */

/** Whether `n` is a power of two, 1 included. */
function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && (n & (n - 1)) === 0;
}

/**
 * The discrete Fourier transform of `re` + i·`im`, in place (radix 2, in
 * time): X[k] = Σ x[j] · e^(−2πi·jk/n). The length is a power of two.
 */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (im.length !== n) throw new Error('re and im must be one length');
  if (!isPowerOfTwo(n)) throw new Error(`the size ${n} is not a power of two`);
  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    for (let k = 0; k < half; k++) {
      const angle = (-2 * Math.PI * k) / size;
      const wr = Math.cos(angle);
      const wi = Math.sin(angle);
      for (let start = 0; start < n; start += size) {
        const a = start + k;
        const b = a + half;
        const tr = re[b]! * wr - im[b]! * wi;
        const ti = re[b]! * wi + im[b]! * wr;
        re[b] = re[a]! - tr;
        im[b] = im[a]! - ti;
        re[a]! += tr;
        im[a]! += ti;
      }
    }
  }
}

/** The Hann window of `n` samples: 0 at the first, 1 in the middle, and it sums to n/2. */
export function hann(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
}

/** The magnitudes of a frame's spectrum, bin by bin from 0 Hz to the Nyquist. */
export interface Spectrum {
  /** Bins 0 to size/2, each a sine's amplitude: one that sits on a bin reads as its own amplitude. */
  magnitudes: Float64Array;
  /** The width of a bin, in Hz. */
  binHz: number;
  sampleRate: number;
}

/**
 * The magnitude spectrum of `samples`, through a Hann window. `size` is the
 * transform's, a power of two at least as long as the frame (the frame is
 * padded with zeros to it, which interpolates the spectrum and does not
 * sharpen it), and by default the frame's own length.
 */
export function spectrumOf(
  samples: ArrayLike<number>,
  sampleRate: number,
  size: number = samples.length,
): Spectrum {
  if (!isPowerOfTwo(size) || size < samples.length)
    throw new Error(`the size ${size} must be a power of two, not smaller than ${samples.length}`);
  const window = hann(samples.length);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let gain = 0;
  for (let i = 0; i < samples.length; i++) {
    re[i] = samples[i]! * window[i]!;
    gain += window[i]!;
  }
  fft(re, im);
  const magnitudes = new Float64Array(size / 2 + 1);
  // A sine of amplitude A leaves A/2 · Σ window in its bin, and again in its mirror.
  for (let k = 0; k < magnitudes.length; k++)
    magnitudes[k] = (2 * Math.hypot(re[k]!, im[k]!)) / gain;
  return { magnitudes, binHz: sampleRate / size, sampleRate };
}

/**
 * The autocorrelation of a frame at every lag from 0 to its length less one:
 * r[lag] = Σ x[j] · x[j + lag], over the samples that have a partner. It is
 * found through the transform, so it costs n log n and not n².
 */
export function autocorrelation(samples: ArrayLike<number>): Float64Array {
  const n = samples.length;
  let size = 1;
  while (size < 2 * n) size *= 2; // room for a lag without wrapping round
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < n; i++) re[i] = samples[i]!;
  fft(re, im);
  for (let k = 0; k < size; k++) {
    re[k] = re[k]! ** 2 + im[k]! ** 2;
    im[k] = 0;
  }
  fft(re, im); // the power spectrum is real and even, so the forward transform is its inverse up to 1/size
  const r = new Float64Array(n);
  for (let lag = 0; lag < n; lag++) r[lag] = re[lag]! / size;
  return r;
}
