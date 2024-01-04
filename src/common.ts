import { RtAudioErrorType, RtAudioFormat } from './types';

export const formatToByteCount = (format: RtAudioFormat) => {
  switch (format) {
    case RtAudioFormat.RTAUDIO_SINT8: return 1;
    case RtAudioFormat.RTAUDIO_SINT16: return 2;
    case RtAudioFormat.RTAUDIO_SINT32: return 4;
    case RtAudioFormat.RTAUDIO_FLOAT32: return 4;
    case RtAudioFormat.RTAUDIO_FLOAT64: return 8;
  }
}

export const getErrorMessage = (errType: RtAudioErrorType, message: string) => {
  switch (errType) {
    case RtAudioErrorType.DEBUG_WARNING: return `DEBUG_WARNING: ${message}`;
    case RtAudioErrorType.DRIVER_ERROR: return `DRIVER_ERROR: ${message}`;
    case RtAudioErrorType.INVALID_DEVICE: return `INVALID_DEVICE: ${message}`;
    case RtAudioErrorType.INVALID_PARAMETER: return `INVALID_PARAMETER: ${message}`;
    case RtAudioErrorType.INVALID_USE: return `INVALID_USE: ${message}`;
    case RtAudioErrorType.MEMORY_ERROR: return `MEMORY_ERROR: ${message}`;
    case RtAudioErrorType.NO_DEVICES_FOUND: return `NO_DEVICES_FOUND: ${message}`;
    case RtAudioErrorType.SYSTEM_ERROR: return `SYSTEM_ERROR: ${message}`;
    case RtAudioErrorType.THREAD_ERROR: return `THREAD_ERROR: ${message}`;
    case RtAudioErrorType.UNSPECIFIED: return `UNSPECIFIED: ${message}`;
    case RtAudioErrorType.WARNING: return `WARNING: ${message}`;
  }
}
