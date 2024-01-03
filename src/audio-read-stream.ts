import { Readable } from 'stream'
import { RtAudio, RtAudioErrorType, RtAudioFormat, RtAudioStreamStatus } from '@hamitzor/rtaudio.js'
import { AudioIOParams, formatToByteCount, getErrorMessage } from './common'

/**
 * Audio read stream
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
export class AudioReadStream extends Readable {
  private _rtAudio: RtAudio
  private _buffer: (Uint8Array | null)[]
  private _shouldBuffer: boolean
  private _shouldStop: boolean
  private _shouldClearBuffer: boolean

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

  resume(): this {
    super.resume()
    this._shouldBuffer = false
    return this
  }

  pause(): this {
    super.pause()
    this._shouldBuffer = true
    return this
  }

  _read(_size: number): void {
    this._shouldBuffer = false
  }

  _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void {
    if (this._rtAudio.isStreamOpen()) {
      this._rtAudio.closeStream()
    }
    callback(error)
  }

  on(event: 'close', listener: () => void): this
  on(event: 'data', listener: (chunk: any) => void): this
  on(event: 'end', listener: () => void): this
  on(event: 'error', listener: (err: Error) => void): this
  on(event: 'pause', listener: () => void): this
  on(event: 'readable', listener: () => void): this
  on(event: 'resume', listener: () => void): this
  on(event: 'api:overflow', listener: () => void): this
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  addListener(event: 'close', listener: () => void): this
  addListener(event: 'data', listener: (chunk: any) => void): this
  addListener(event: 'end', listener: () => void): this
  addListener(event: 'error', listener: (err: Error) => void): this
  addListener(event: 'pause', listener: () => void): this
  addListener(event: 'readable', listener: () => void): this
  addListener(event: 'resume', listener: () => void): this
  addListener(event: 'api:overflow', listener: () => void): this
  addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.addListener(event, listener)
  }

  once(event: 'close', listener: () => void): this
  once(event: 'data', listener: (chunk: any) => void): this
  once(event: 'end', listener: () => void): this
  once(event: 'error', listener: (err: Error) => void): this
  once(event: 'pause', listener: () => void): this
  once(event: 'readable', listener: () => void): this
  once(event: 'resume', listener: () => void): this
  once(event: 'api:overflow', listener: () => void): this
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(event, listener)
  }

  removeListener(event: 'close', listener: () => void): this
  removeListener(event: 'data', listener: (chunk: any) => void): this
  removeListener(event: 'end', listener: () => void): this
  removeListener(event: 'error', listener: (err: Error) => void): this
  removeListener(event: 'pause', listener: () => void): this
  removeListener(event: 'readable', listener: () => void): this
  removeListener(event: 'resume', listener: () => void): this
  removeListener(event: 'api:overflow', listener: () => void): this
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.removeListener(event, listener)
  }

  emit(event: 'close'): boolean
  emit(event: 'data', chunk: any): boolean
  emit(event: 'end'): boolean
  emit(event: 'error', err: Error): boolean
  emit(event: 'pause'): boolean
  emit(event: 'readable'): boolean
  emit(event: 'resume'): boolean
  emit(event: 'api:overflow'): boolean
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

}

export const createAudioReadStream = (params: AudioIOParams) => new AudioReadStream(params)