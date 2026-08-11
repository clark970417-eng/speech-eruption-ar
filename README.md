# Speech Eruption AR

An interactive camera experience developed for school broadcasts and creative presentations.

## Purpose

School announcements are usually informative but visually static. I developed Speech Eruption AR to make live broadcasts more expressive by connecting a presenter's voice and facial movement to animated words on screen. The project explores how browser-based computer vision, audio analysis, and real-time graphics can support more engaging school communication.

## How It Works

The application uses the camera to locate the speaker's face and mouth, while the microphone provides a live volume signal. When the speaker opens their mouth and speaks, words and symbols are emitted from the detected mouth position. Their size and motion respond to the strength of the audio signal.

## Features

- Real-time face and mouth tracking with MediaPipe
- Microphone volume analysis through the Web Audio API
- Animated word particles with configurable motion, gravity, scale, and lifetime
- Fixed-text mode for planned announcements
- Editable word lists for different broadcast themes
- Optional theme-based word-list helper
- Camera switching and visual controls for different presentation environments
- Progressive Web App support for installation on compatible devices

## Technical Stack

- React and TypeScript
- Vite
- MediaPipe Tasks Vision
- Web Audio API and Canvas-based animation
- Vite PWA

## Run Locally

### Requirements

- Node.js 18 or later
- npm
- A browser with camera and microphone support

### Setup

```bash
npm install
npm run dev
```

Open the local address displayed by Vite and allow camera and microphone access when prompted. The core camera effect, face tracking, audio response, fixed-text mode, and editable word lists do not require an API key.

### Optional Word-List Helper

An optional helper can create themed word lists through the Gemini API. To enable only this extension, create `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

## Production Build

```bash
npm run build
npm run preview
```

## Privacy and Presentation Notes

Camera frames and microphone input are processed in the browser for the live effect. Presenters should still obtain permission before recording or streaming participants, and should test lighting, framing, microphone sensitivity, and background visibility before a school broadcast.
