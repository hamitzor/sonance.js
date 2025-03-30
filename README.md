<h1>
  sonance.js
  <br>
</h1>
<p>Audio I/O on Node.js</p>

<p>
  <a href="https://www.npmjs.com/package/@hamitzor/sonance.js">
    <img src="https://img.shields.io/badge/2.0.0-brightgreen?style=flat&label=npm%20package"
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

- Works on Linux, Windows and macOS
- Probe available audio devices
- Stream audio to output devices
- Stream audio from input devices
- Fully configurable audio streaming, allows configuring
  - sample rate
  - bit depth
  - frame size
  - number of channels
- The library is implemented fully in compatible with Node.js streams
  - Convenient to use with network I/O, file I/O and other streams on Node.js
  - Comes with all the quirks of Node.js streams

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

For installing for Electron, see this section.

## Usage

To see some complete examples, you can check out the <a href="https://github.com/hamitzor/sonance.js-examples">examples repository</a>.

But here are some simple examples:

### Read from microphone

```javascript
import { AudioInputStream, probeDevices, RtAudioFormat } from '@hamitzor/sonance.js'


// Get the default input device
const { defaultInputDevice } = probeDevices()

// Create a read stream
const audioStream = new AudioInputStream({
  deviceId: defaultInputDevice.id, // The device to read from
  channels: 1, // The number of channels
  sampleRate: 48000, // Sample rate
  bufferFrames: 1920, // Frame size: number of samples in a frame
  format: RtAudioFormat.RTAUDIO_SINT16, // 16-bit signed integer (16-bit depth)
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
import { AudioOutputStream, probeDevices, RtAudioFormat } from '@hamitzor/sonance.js'

// Get the default output device
const { defaultOutputDevice } = probeDevices()

// Create a write stream
const audioStream = new AudioOutputStream({
  deviceId: defaultOutputDevice.id, // The device to stream to
  channels: 1, // The number of channels
  sampleRate: 48000, // Sample rate
  bufferFrames: 1920, // Frame size: number of samples in a frame
  format: RtAudioFormat.RTAUDIO_SINT16, // 16-bit signed integer (16-bit depth)
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

## Installing for Electron 11.x.x - 28.x.x

If you'll be using the package with Electron, you'll have to set some environment variables before the installation.

For example, for Electron v28.0.0

On bash:
```
export npm_config_runtime=electron
export npm_config_target=28.0.0
```

On powershell:
```
$env:npm_config_runtime = "electron"
$env:npm_config_target = "28.0.0"
```

On cmd:
```
set npm_config_runtime=electron
set npm_config_target=28.0.0
```

To see a complete list of Electron versions, see this [registry](https://github.com/electron/node-abi/blob/main/abi_registry.json).

These environment variables will help the installation command to pick the correct [prebuilds](https://github.com/hamitzor/rtaudio.js/releases/tag/v1.2.0). After setting these up, you can simply use `npm` or `yarn`

```
npm install @hamitzor/sonance.js
```

or

```
yarn add @hamitzor/sonance.js
```

As simple as that, no additional library/software required for installation. If you run into trouble during installation, don't hesitate to create an issue at <a href="https://github.com/hamitzor/rtaudio.js/issues">Github</a>.

## Credits

This packages uses the C++ library named rtaudio under the hood. To check it out, visit https://github.com/thestk/rtaudio.

## License

<a href="https://raw.githubusercontent.com/hamitzor/sonance.js/master/LICENSE">MIT</a>
