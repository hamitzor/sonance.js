import { Readable, Writable } from 'stream'
import { RtAudio, RtAudioErrorType, RtAudioFormat, RtAudioStreamStatus } from '@hamitzor/rtaudio.js'
import { AudioIOParams, formatToByteCount, getErrorMessage } from './common'
import { isUint8Array } from 'util/types'

const merge = (u1: Uint8Array, u2: Uint8Array) => {
  const merged = new Uint8Array(u1.byteLength + u2.byteLength)
  merged.set(u1, 0)
  merged.set(u2, u1.byteLength)
  return merged
}

const head = (u: Uint8Array, n: number) => {
  if (u.byteLength < n) {
    return [new Uint8Array(0), u.subarray()]
  }

  const h = u.subarray(0, n)
  const rest = u.subarray(n, u.byteLength)

  return [h, rest]
}

/**
 * Audio write stream
 * 
 * @param api the low level API to utilize (An available API will be used if omitted)
 * @param deviceId deviceId the id of the input device
 * @param channels the number of channels to use. Device should support the provided value
 * @param firstChannel the index of the channel that will be considered the first (default=0)
 * @param format the format of the samples (bit depth) (default=16-bit)
 * @param sampleRate the sample rate
 * @param bufferFrames specifies frame size
 * @param options further options
 */
export class AudioWriteStream extends Writable {
  private _chunkSize: number
  private _buffer: Uint8Array
  private _rtAudio: RtAudio
  private _shouldClose: boolean
  private _destroyCallback: (error?: Error | null | undefined) => void
  private _destroyError: Error | null

  constructor(params: AudioIOParams) {
    const chunkSize = params.bufferFrames * params.channels * formatToByteCount(params.format || RtAudioFormat.RTAUDIO_SINT16)
    const highWaterMark = params.highWaterMark || chunkSize
    super({ highWaterMark: highWaterMark })

    this._chunkSize = chunkSize
    this._shouldClose = false
    this._rtAudio = params.api ? new RtAudio(params.api) : new RtAudio()
    this._destroyCallback = () => { }
    this._destroyError = null
    this._buffer = new Uint8Array(0)
    this._rtAudio.setErrorCallback((type, message) => {
      if (type > RtAudioErrorType.DEBUG_WARNING) {
        this.emit('error', new Error(getErrorMessage(type, message)))
      }
    })

    this._rtAudio.openStream(
      {
        deviceId: params.deviceId,
        nChannels: params.channels,
        firstChannel: params.firstChannel
      },
      null,
      params.format || RtAudioFormat.RTAUDIO_SINT16,
      params.sampleRate,
      params.bufferFrames,
      params.options || null,
      (output, _input, _nFrame, _streamTime, status) => {
        const [h, rest] = head(this._buffer, this._chunkSize)

        this._buffer = rest

        if (h.byteLength > 0) {
          output.set(h, 0)
          this.emit('api:processed')
        } else if (this._shouldClose) {
          this._rtAudio.closeStream()
          this._destroyCallback(this._destroyError)
        }

        if (status === RtAudioStreamStatus.RTAUDIO_OUTPUT_UNDERFLOW) {
          this.emit('api:underflow')
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

  /** Enable warnings, which will be provided through the 'error' event */
  enableWarnings(): void {
    this._rtAudio.showWarnings(true)
  }

  /** Disable warnings */
  disableWarnings(): void {
    this._rtAudio.showWarnings(false)
  }

  _write(chunk: Uint8Array, _encoding: BufferEncoding, callback: () => void): void {
    if (!isUint8Array(chunk)) {
      throw new TypeError('chunk should be an instance of Uint8Array')
    }

    if (this._rtAudio.isStreamRunning()) {
      this._buffer = merge(this._buffer, chunk)
    }

    callback()
  }

  _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void {
    this._shouldClose = true
    if (this._rtAudio.isStreamOpen()) {
      this._destroyCallback = callback
      this._destroyError = error
    } else {
      callback(error)
    }
  }

  _writev(chunks: { chunk: Uint8Array }[], callback: (error?: Error | null | undefined) => void): void {
    if (chunks.find(({ chunk }) => !isUint8Array(chunk))) {
      throw new TypeError('each chunk should be an instance of Uint8Array')
    }

    if (this._rtAudio.isStreamRunning()) {
      chunks.forEach(({ chunk }) => {
        this._buffer = merge(this._buffer, chunk)
      })
    }

    callback()
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    this._shouldClose = true
    callback()
  }

  on(event: 'close', listener: () => void): this
  on(event: 'drain', listener: () => void): this
  on(event: 'error', listener: (err: Error) => void): this
  on(event: 'finish', listener: () => void): this
  on(event: 'pipe', listener: (src: Readable) => void): this
  on(event: 'unpipe', listener: (src: Readable) => void): this
  on(event: 'api:underflow', listener: () => void): this
  on(event: 'api:processed', listener: () => void): this
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  addListener(event: 'close', listener: () => void): this
  addListener(event: 'drain', listener: () => void): this
  addListener(event: 'error', listener: (err: Error) => void): this
  addListener(event: 'finish', listener: () => void): this
  addListener(event: 'pipe', listener: (src: Readable) => void): this
  addListener(event: 'unpipe', listener: (src: Readable) => void): this
  addListener(event: 'api:underflow', listener: () => void): this
  addListener(event: 'api:processed', listener: () => void): this
  addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.addListener(event, listener)
  }

  once(event: 'close', listener: () => void): this
  once(event: 'drain', listener: () => void): this
  once(event: 'error', listener: (err: Error) => void): this
  once(event: 'finish', listener: () => void): this
  once(event: 'pipe', listener: (src: Readable) => void): this
  once(event: 'unpipe', listener: (src: Readable) => void): this
  once(event: 'api:underflow', listener: () => void): this
  once(event: 'api:processed', listener: () => void): this
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(event, listener)
  }

  removeListener(event: 'close', listener: () => void): this
  removeListener(event: 'drain', listener: () => void): this
  removeListener(event: 'error', listener: (err: Error) => void): this
  removeListener(event: 'finish', listener: () => void): this
  removeListener(event: 'pipe', listener: (src: Readable) => void): this
  removeListener(event: 'unpipe', listener: (src: Readable) => void): this
  removeListener(event: 'api:underflow', listener: () => void): this
  removeListener(event: 'api:processed', listener: () => void): this
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.removeListener(event, listener)
  }

  emit(event: 'close'): boolean
  emit(event: 'drain'): boolean
  emit(event: 'error', err: Error): boolean
  emit(event: 'finish'): boolean
  emit(event: 'pipe', src: Readable): boolean
  emit(event: 'unpipe', src: Readable): boolean
  emit(event: 'api:underflow'): boolean
  emit(event: 'api:processed'): boolean
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

}

export const createAudioWriteStream = (params: AudioIOParams) => new AudioWriteStream(params)
