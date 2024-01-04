import { formatToByteCount, getErrorMessage } from './common'
import { AudioInputStream } from './audio-input-stream'
import { AudioOutputStream } from './audio-output-stream'
import { probeApis, probeDevices } from './probe'
import {
  RtAudio,
} from '@hamitzor/rtaudio.js'
import {
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

export const rtAudioVersion = RtAudio.getVersion()