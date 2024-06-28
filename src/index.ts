import { AudioInputStream } from './audio-input-stream'
import { AudioOutputStream } from './audio-output-stream'
import { probeApis, probeDevices } from './probe'
import {
  RtAudio,
  DeviceInfo,
  RtAudioApi,
  RtAudioCallback,
  RtAudioErrorType,
  RtAudioFormat,
  RtAudioStreamFlags,
  RtAudioStreamStatus,
  StreamOptions,
  StreamParameters,
} from '@hamitzor/rtaudio.js'
import {
  AudioIOParams,
} from './types'

export const getApiDisplayName = RtAudio.getApiDisplayName
export const getApiName = RtAudio.getApiName
export const getAvailableApis = RtAudio.getCompiledApi

export {
  AudioInputStream,
  AudioOutputStream,
  probeApis,
  probeDevices,
  DeviceInfo,
  RtAudioApi,
  RtAudioCallback,
  RtAudioErrorType,
  RtAudioFormat,
  RtAudioStreamFlags,
  RtAudioStreamStatus,
  StreamOptions,
  StreamParameters,
  AudioIOParams,
}

export { rtAudioFormatToByteCount, getReadableErrorMessage } from './common'

export const rtAudioVersion = RtAudio.getVersion()