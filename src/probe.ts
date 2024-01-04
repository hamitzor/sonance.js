import { RtAudio } from '@hamitzor/rtaudio.js'
import { DeviceInfo, RtAudioApi } from './types'

/** Get available low level audio APIs */
export const probeApis = () => RtAudio.getCompiledApi().map(id => ({
  id,
  name: RtAudio.getApiDisplayName(id)
}))

/** Get available devices for a given API
 * 
 * @param api the API to query. If omitted, an available api will be used.
 */
export const probeDevices = (api?: RtAudioApi): {
  devices: DeviceInfo[]
  defaultInputDevice?: DeviceInfo
  defaultOutputDevice?: DeviceInfo
} => {
  const rtAudio = api ? new RtAudio(api) : new RtAudio()

  return {
    devices: rtAudio.getDevices(),
    defaultInputDevice: rtAudio.getDevices().find(({ id }) => id === rtAudio.getDefaultInputDevice()),
    defaultOutputDevice: rtAudio.getDevices().find(({ id }) => id === rtAudio.getDefaultOutputDevice()),
  }
}
