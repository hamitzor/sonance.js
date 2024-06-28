import { RtAudioApi, RtAudioFormat, StreamOptions } from '@hamitzor/rtaudio.js'

export type AudioIOParams = {
  /** the audio API to utilize (An available API will be used if omitted) */
  api?: RtAudioApi

  /** deviceId the id of the input device */
  deviceId: number

  /** the number of channels to use. Device should support the provided value */
  channels: number

  /** the index of the channel that will be considered the first (default=0) */
  firstChannel?: number

  /** the format of the samples (bit depth) (default=16-bit) */
  format?: RtAudioFormat

  /** the sample rate */
  sampleRate: number

  /** specifies frame size */
  bufferFrames: number

  /** further options */
  options?: StreamOptions

  /** stream high water mark */
  highWaterMark?: number
}
