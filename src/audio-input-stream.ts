import { Readable } from 'stream'
import { RtAudio } from '@hamitzor/rtaudio.js'
import { formatToByteCount, getErrorMessage } from './common'
import { AudioIOParams, RtAudioErrorType, RtAudioFormat, RtAudioStreamStatus } from './types'

/**
 * Class that represents an audio input stream. It is used to stream audio from an input device,
 * e.g. a microphone. It uses `RtAudio` class from 
 * {@link https://github.com/hamitzor/rtaudio.js | @hamitzor/rtaudio.js}
 * package under the hood.
 * 
 * See {@link AudioIOParams} for the parameters to instantiate it.
 * 
 * This class extends {@link https://nodejs.org/docs/latest-v14.x/api/stream.html#stream_readable_streams | `stream.Readable`},
 * which means that it exposes all the methods and accessors and emits all the events a
 * {@link https://nodejs.org/docs/latest-v14.x/api/stream.html#stream_readable_streams | `stream.Readable`} 
 * would do. The
 * {@link https://nodejs.org/docs/latest-v14.x/api/stream.html#stream_readable_read_size | `stream.Readable.read`} method
 * is for example used to retrieve audio data from input device. It has a couple of additional methods and accessors
 * related with the audio stream that can be checked down on this page.
 * 
 * The chunks of audio data are obtained in realtime from input device in PCM form.
 * 
 * Each chunk contains a sequence of samples, that can be in one of these formats:
 * 
 *  - signed 8-bit integer ({@link RtAudioFormat | `RtAudioFormat.RTAUDIO_SINT8`})
 *  - signed 16-bit integer ({@link RtAudioFormat | `RtAudioFormat.RTAUDIO_SINT16`})
 *  - signed 32-bit integer ({@link RtAudioFormat | `RtAudioFormat.RTAUDIO_SINT32`})
 *  - 32-bit float normalized between plus/minus 1.0 ({@link RtAudioFormat | `RtAudioFormat.RTAUDIO_FLOAT32`})
 *  - 64-bit float normalized between plus/minus 1.0 ({@link RtAudioFormat | `RtAudioFormat.RTAUDIO_FLOAT64`})
 * 
 * `params.format` is used to specify the format.
 * 
 * `params.bufferFrames` can be used to specify the size of the internal buffer used
 * to accumulate audio samples before propagating it to the user application. For example
 * if `params.bufferFrames` is set to `n`, then the library would wait `n` samples
 * to be delivered (from each channel) from the input device before redirecting it to the user
 * application. As expected, specifying a small value for `params.bufferFrames` can be
 * less performant, while specifying a big value might introduce lag in the stream.
 * 
 * The `read` method returns a chunk which is a sequence of bytes and is an instance of `Uint8Array`. 
 * The chunk can be converted into `Int16Array`, `Int32Array`, `Float32Array` `Float64Array` to access 
 * samples by index. For example, if the format is signed 16-bit integer then the following can be
 * used to access each sample by index:
 * 
 * 
 * ```javascript
 * const chunk = audioStream.read()
 * const array = Int16Array.from(chunk.buffer)
 * array.at(0) // the first sample
 * ```
 * 
 * Note: The underlying RtAudio library uses system's endianness. So using `Int16Array.from(chunk.buffer)`
 * is guaranteed to be safe only on the same platform/architecture that generated the audio input data. 
 * When transferring this data to another platform/architecture endianness might need to be adjusted.
 * 
 * By default, the samples are delivered in interleaved manner within chunks.
 * For example, if stream has two channels, a chunk would look like:
 * 
 * ```text
 * [1. sample of 1. channel] [1.sample of 2.channel] [2. sample of 1. channel] [2. sample of 2. channel] ... [n-th sample of 1. channel] [n-th sample of 2. channel]
 * ```
 * 
 * (square brackets are for representative purposes)
 * 
 * This behaviour can be altered to non-interleaved by specifying 
 * {@link RtAudioStreamFlags.RTAUDIO_NONINTERLEAVED | `RtAudioStreamFlags.RTAUDIO_NONINTERLEAVED`} 
 * in `params.options.flags`. In that case, first half of the chunk
 * would contain the samples from the first channel and the second half would contain the samples
 * from the second channel.
 * 
 * An audio stream can be consumed in two general ways:
 * - forwarding without any processing, e.g. writing raw audio directly to a file
 * - processing, e.g. encoding, noise cancelling, reducing volume -> anything that requires processing
 * each sample
 * 
 * If it is intended to consume the stream in the first fashion, the `read` method can be called with an arbitrary
 * `size`, or no `size` at all.
 * 
 * If it is intended to consume the stream in the second fashion, the `read` method should be called 
 * with no `size`. When no `size` is given, `read` will return exactly `params.bufferFrames` samples 
 * for each channel. Which allows you to simply convert the chunk into an appropriate typed array, e.g. 
 * `Int16Array`, and access each sample by index, as shown above. 
 * 
 * If you insist providing `size` (means that you want to fetch exactly `size` bytes), you will have to manually 
 * come up with an appropriate `size`. Which depends on whether non-interleaved mode is activated or not. 
 * For example, if the data is interleaved, the `size` would need to be a multiple of 
 * `(number of channels) x (number of bytes of the format)`. This hassle can be prevented by simply specifying no size,
 * which will make `read` return exactly `(number of channels) x (number of bytes of the format) x params.bufferFrames` bytes.
 * 
 * Since `AudioInputStream` is a `stream.Readable`, it can be used in any fashion a `stream.Readable` can be used.
 * That is, it can be piped with a `stream.Writable`, `stream.Transform` or a `stream.Duplex`.
 * 
 * `highWaterMark` for the `AudioInputStream` instance can be specified during instantiation through 
 * `params.highWaterMark`.
 * 
 * See {@link https://github.com/hamitzor/sonance.js-examples | sonance.js Examples repo} for some example apps
 * that use `AudioInputStream`.
 * 
 */
export class AudioInputStream extends Readable {
  private _rtAudio: RtAudio
  private _buffer: (Uint8Array | null)[]
  private _shouldBuffer: boolean
  private _shouldStop: boolean
  private _shouldClearBuffer: boolean

  /**
   * Create an audio input stream
   * 
   * @param params parameters for the input stream
   */
  constructor(params: AudioIOParams) {
    const highWaterMark = params.bufferFrames * params.channels * formatToByteCount(params.format || RtAudioFormat.RTAUDIO_SINT16)
    super({ highWaterMark: highWaterMark })

    this._rtAudio = params.api ? new RtAudio(params.api) : new RtAudio()
    this._buffer = []
    this._shouldBuffer = true
    this._shouldStop = false
    this._shouldClearBuffer = false

    this._rtAudio.setErrorCallback((type, message) => {
      if (type > RtAudioErrorType.DEBUG_WARNING) {
        this.emit('error', new Error(getErrorMessage(type, message)))
      }
    })

    this._rtAudio.openStream(
      null,
      {
        deviceId: params.deviceId,
        nChannels: params.channels,
        firstChannel: params.firstChannel
      },
      params.format || RtAudioFormat.RTAUDIO_SINT16,
      params.sampleRate,
      params.bufferFrames,
      params.options || null,
      (_output, input, _nFrame, _streamTime, status) => {
        if (this._shouldClearBuffer) {
          this._shouldClearBuffer = false
          this._buffer = []
          return
        }

        if (this.closed) {
          return
        }

        if (status === RtAudioStreamStatus.RTAUDIO_INPUT_OVERFLOW) {
          this.emit('api:overflow')
        }

        if (this._shouldStop) {
          if (this._shouldBuffer) {
            if (this._buffer.length === 0) {
              this.push(null)
              return
            }

            this._buffer.push(null)
            return
          }

          let bufferHead = this._buffer.shift()

          if (bufferHead === undefined) {
            this.push(null)
            return
          }

          if (!this.push(bufferHead)) {
            this._shouldBuffer = true
          }

          return
        }

        if (this._shouldBuffer) {
          this._buffer.push(input)
          return
        }

        let bufferHead = this._buffer.shift()

        if (bufferHead === undefined) {
          if (!this.push(input)) {
            this._shouldBuffer = true
          }
          return
        }

        this._buffer.push(input)

        if (!this.push(bufferHead)) {
          this._shouldBuffer = true
          return
        }
      }
    )

    this._rtAudio.startStream()
  }

  /** Get the latency */
  get latency(): number { return this._rtAudio.getStreamLatency() }

  /** Get the actual sample rate.
   * On some systems, the sample rate used may be slightly different
   * than that specified in the stream parameters. If a stream is not
   * open, a value of zero is returned.
   */
  get getTrueSampleRate(): number { return this._rtAudio.getStreamSampleRate() }

  /** Get the time passed since the stream has started */
  get time(): number { return this._rtAudio.getStreamTime() }

  get isAudioPaused(): boolean { return !this._rtAudio.isStreamRunning() }

  /** Enable warnings, which will be provided through the 'error' event */
  enableWarnings(): void {
    this._rtAudio.showWarnings(true)
  }

  /** Disable warnings */
  disableWarnings(): void {
    this._rtAudio.showWarnings(false)
  }

  stopAudio() {
    this._shouldStop = true
  }

  resumeAudio() {
    if (!this._rtAudio.isStreamRunning()) {
      this._buffer = []
      this._shouldClearBuffer = true
      this._rtAudio.startStream()
    }

    return this
  }

  pauseAudio() {
    if (this._rtAudio.isStreamRunning()) {
      this._rtAudio.abortStream()
    }

    return this
  }

  /** @ignore */
  resume(): this {
    super.resume()
    this._shouldBuffer = false
    return this
  }

  /** @ignore */
  pause(): this {
    super.pause()
    this._shouldBuffer = true
    return this
  }

  /** @private */
  _read(_size: number): void {
    this._shouldBuffer = false
  }

  /** @private */
  _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void {
    if (this._rtAudio.isStreamOpen()) {
      this._rtAudio.closeStream()
    }
    callback(error)
  }

  /** @ignore */
  on(event: 'close', listener: () => void): this
  /** @ignore */
  on(event: 'data', listener: (chunk: any) => void): this
  /** @ignore */
  on(event: 'end', listener: () => void): this
  /** @ignore */
  on(event: 'error', listener: (err: Error) => void): this
  /** @ignore */
  on(event: 'pause', listener: () => void): this
  /** @ignore */
  on(event: 'readable', listener: () => void): this
  /** @ignore */
  on(event: 'resume', listener: () => void): this
  /** @ignore */
  on(event: 'api:overflow', listener: () => void): this
  /** @ignore */
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  /** @ignore */
  addListener(event: 'close', listener: () => void): this
  /** @ignore */
  addListener(event: 'data', listener: (chunk: any) => void): this
  /** @ignore */
  addListener(event: 'end', listener: () => void): this
  /** @ignore */
  addListener(event: 'error', listener: (err: Error) => void): this
  /** @ignore */
  addListener(event: 'pause', listener: () => void): this
  /** @ignore */
  addListener(event: 'readable', listener: () => void): this
  /** @ignore */
  addListener(event: 'resume', listener: () => void): this
  /** @ignore */
  addListener(event: 'api:overflow', listener: () => void): this
  /** @ignore */
  addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.addListener(event, listener)
  }

  /** @ignore */
  once(event: 'close', listener: () => void): this
  /** @ignore */
  once(event: 'data', listener: (chunk: any) => void): this
  /** @ignore */
  once(event: 'end', listener: () => void): this
  /** @ignore */
  once(event: 'error', listener: (err: Error) => void): this
  /** @ignore */
  once(event: 'pause', listener: () => void): this
  /** @ignore */
  once(event: 'readable', listener: () => void): this
  /** @ignore */
  once(event: 'resume', listener: () => void): this
  /** @ignore */
  once(event: 'api:overflow', listener: () => void): this
  /** @ignore */
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(event, listener)
  }

  /** @ignore */
  removeListener(event: 'close', listener: () => void): this
  /** @ignore */
  removeListener(event: 'data', listener: (chunk: any) => void): this
  /** @ignore */
  removeListener(event: 'end', listener: () => void): this
  /** @ignore */
  removeListener(event: 'error', listener: (err: Error) => void): this
  /** @ignore */
  removeListener(event: 'pause', listener: () => void): this
  /** @ignore */
  removeListener(event: 'readable', listener: () => void): this
  /** @ignore */
  removeListener(event: 'resume', listener: () => void): this
  /** @ignore */
  removeListener(event: 'api:overflow', listener: () => void): this
  /** @ignore */
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.removeListener(event, listener)
  }

  /** @ignore */
  emit(event: 'close'): boolean
  /** @ignore */
  emit(event: 'data', chunk: any): boolean
  /** @ignore */
  emit(event: 'end'): boolean
  /** @ignore */
  emit(event: 'error', err: Error): boolean
  /** @ignore */
  emit(event: 'pause'): boolean
  /** @ignore */
  emit(event: 'readable'): boolean
  /** @ignore */
  emit(event: 'resume'): boolean
  /** @ignore */
  emit(event: 'api:overflow'): boolean
  /** @ignore */
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

}
