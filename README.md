<h1>
  Sonance.js
  <br>
</h1>

<h4>Audio I/O on Node.js</h4>

<p>
  <a href="https://www.npmjs.com/package/@hamitzor/sonance.js">
    <img src="https://img.shields.io/badge/1.0.1-brightgreen?style=flat&label=npm%20package"
         alt="NPM">
  </a>
</p>

<p>
  <a href="#key-features">Overview</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

## Overview

- Access well-known audio I/O APIs
- Windows: WASAPI, DirectSound
- Linux: ALSA, JACK and PulseAudio
- Probe available audio devices
- Stream audio to output devices
- Stream audio from input devices
- Fully configurable audio streaming, allows configuring
  - sample rate
  - bit depth
  - frame size
  - number of channels
- The library is implemented fully with Node.js streams
  - Convenient to use with network I/O, file I/O and other streams on Node.js
  - Comes with all the advantages of Node.js streams

## Installation

Install it using `npm` or `yarn`

```
npm install @hamitzor/sonance.js
```

or

```
yarn add @hamitzor/sonance.js
```

As simple as that, no additional library/software required for installation. If you run into trouble during installation, don't hesitate to create an issue at <a href="https://github.com/hamitzor/sonance.js/issues">Github</a>.

> **Note**
> Only Windows and Linux are supported at the moment.

## Usage

To see some complete examples, you can check out the <a href="https://github.com/hamitzor/sonance.js-examples">examples repository</a>.

But here are some simple examples:

### Read from microphone

```javascript
const {
  createAudioInputStream,
  probeDevices,
  LowLevelAudioApi,
} = require("@hamitzor/sonance.js");

// Get the default input device
const { defaultInputDevice } = probeDevices();

// Create a read stream
const audioStream = createAudioInputStream({
  api: LowLevelAudioApi.WASAPI, // On Linux, can be changed to, e.g. ALSA
  deviceId: defaultInputDevice.id, // The device to read from
  channels: 1, // The number of channels
  sampleRate: 48000, // Sample rate
  bufferFrames: 1920, // Frame size: number of samples in a frame
  format: PCMFormat.RTAUDIO_SINT16, // 16-bit signed integer (16-bit depth)
});

// Do whatever you want with the stream

// E.g. read 3840 bytes from it
const data = audioStream.read(3840);

// Or, pass it to a file write stream to save to a file
const { pipeline } = require("stream");
const { createWriteStream } = require("fs");

pipeline(audioStream, createWriteStream("somefile.raw"));

// Or, pass it to a TCP connection to send it over network
const { createWriteStream } = require("fs");

const server = net.createServer((connection) => {
  pipeline(audioStream, connection);
});

// Or do anything you want that is achievable with a readable Node.js stream
```

### Stream audio to output devices

```javascript
const {
  createAudioOutputStream,
  probeDevices,
  LowLevelAudioApi,
} = require("@hamitzor/sonance.js");

// Get the default output device
const { defaultOutputDevice } = probeDevices();

// Create a write stream
const audioStream = createAudioOutputStream({
  api: LowLevelAudioApi.WASAPI, // On Linux, can be changed to, e.g. ALSA
  deviceId: defaultOutputDevice.id, // The device to stream to
  channels: 1, // The number of channels
  sampleRate: 48000, // Sample rate
  bufferFrames: 1920, // Frame size: number of samples in a frame
  format: PCMFormat.RTAUDIO_SINT16, // 16-bit signed integer (16-bit depth)
});

// Do whatever you want with the stream

// E.g. write 3840 bytes to it
const data = audioStream.write(new Uint8Array(3840).fill(0));

// Or, pass it to a file read stream to playback a file
const { pipeline } = require("stream");
const { createReadStream } = require("fs");

pipeline(createReadStream("somefile.raw"), audioStream);

// Or, pass it to a TCP connection for playback over network
const { createWriteStream } = require("fs");

const server = net.createServer((connection) => {
  pipeline(connection, audioStream);
});

// Or do anything you want that is achievable with a writable Node.js stream
```

## Credits

This packages uses the C++ library named rtaudio under the hood. To check it out, visit https://github.com/thestk/rtaudio.

## License

<a href="https://raw.githubusercontent.com/hamitzor/sonance.js/master/LICENSE">MIT</a>
