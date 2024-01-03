import { AudioIOParams, formatToByteCount, getErrorMessage } from './common'
import { createAudioReadStream, AudioReadStream } from './audio-read-stream'
import { createAudioWriteStream, AudioWriteStream } from './audio-write-stream'
import { probeApis, probeDevices } from './probe'
import {
  DeviceInfo,
  RtAudio,
  RtAudioApi,
  RtAudioCallback,
  RtAudioErrorType,
  RtAudioFormat,
  RtAudioStreamFlags,
  RtAudioStreamStatus,
  StreamOptions,
  StreamParameters
} from '@hamitzor/rtaudio.js'

export const rtAudioVersion = RtAudio.getVersion()
export const getApiDisplayName = RtAudio.getApiDisplayName
export const getApiName = RtAudio.getApiName
export const getAvailableApis = RtAudio.getCompiledApi

export {
  AudioIOParams,
  formatToByteCount,
  getErrorMessage,
  createAudioReadStream,
  AudioReadStream,
  AudioWriteStream,
  createAudioWriteStream,
  DeviceInfo,
  RtAudioApi,
  RtAudioCallback,
  RtAudioErrorType,
  RtAudioFormat,
  RtAudioStreamFlags,
  RtAudioStreamStatus,
  StreamOptions,
  StreamParameters,
  probeApis,
  probeDevices
}