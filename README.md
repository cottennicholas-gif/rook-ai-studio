# Rook AI Studio

A mobile-friendly, static image-generation and GIF-making starter app.

## Current features
- Prompt-based image generation through the community-powered AI Horde API
- Square, portrait, and landscape output sizes
- 1–4 image requests
- Gallery with links to open generated images
- Client-side GIF assembly from generated images

## Run it
This is a static site. Open `index.html` through a local static server or publish the files with GitHub Pages.

For local testing, a simple static server is recommended rather than opening the file directly.

## Important notes
- The app currently uses AI Horde's anonymous public key (`0000000000`). Anonymous requests may have lower priority and can wait in a shared queue.
- This is not unlimited guaranteed generation. Availability, speed, model choice, and worker capacity depend on the community network.
- Do not put a personal API key in frontend code. If you later register with AI Horde, a safer server-side proxy can be added.
- GIF creation depends on the image host allowing browser cross-origin access. If that is blocked, images remain available individually and GIF export will show an error.
- This starter is a prototype; it has not yet been deployed or tested against every browser/device.

## API flow
The app submits to `/v2/generate/async`, checks progress with `/v2/generate/check/{id}`, then retrieves the completed output from `/v2/generate/status/{id}`.

See the [AI Horde API](https://aihorde.net/api/) and [integration guide](https://github.com/Haidra-Org/AI-Horde/blob/main/README_integration.md).
