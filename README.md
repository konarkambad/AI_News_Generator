# AI News Generator

**Live demo:** https://ai-news-generator.netlify.app

A small web app that generates short news articles using Claude. You pick a topic, an audience, a tone, a language and a length, and the app produces a draft you can read, copy, or download as an HTML file.

I built this as an end-to-end project to learn how to integrate an LLM into a real, deployable web product – not just a notebook calling an API. So a lot of the work went into the pieces around the model: a serverless backend, safe API key handling, a clean UI and a bit of analytics.

## How it works

The frontend is plain HTML, CSS and JavaScript, bundled with Webpack and styled with a small bit of Tailwind. When the user submits the form, the browser calls a Netlify serverless function (`/.netlify/functions/fetchAI`) which forwards the prompt to the Anthropic API. The serverless layer keeps the API key on the server side instead of exposing it in the browser.

The prompt is built from the user's inputs (topic, audience, tone, length, language) and the model returns the news content as HTML, which the page renders directly.

## Features

- Topic, audience, tone, language and length are all configurable
- Dark / light mode toggle
- Copy to clipboard and download as a self-contained HTML file
- Thumbs up / thumbs down feedback wired to Google Analytics events
- Loading spinner and proper error handling on the UI

## Tech

- Frontend: HTML, CSS, Tailwind, vanilla JavaScript
- Bundler: Webpack
- Backend: Netlify serverless functions (Node)
- LLM: Claude via the Anthropic API
- Hosting: Netlify
- Tracking: Google Analytics, Google AdSense

## How to run it locally

```bash
npm install
npm run start
```

You'll need to add your Anthropic API key to a local environment variable so the serverless function can pick it up. There's an `env.js.example` file you can copy and fill in.

## Files

- `index.html` – page structure
- `index.css` and `tailwind.css` – styles
- `index.js` – form logic, API calls, theme toggle, feedback events
- `netlify/functions/fetchAI` – the serverless function that calls the Anthropic API
- `netlify.toml` – build and deploy config for Netlify
- `webpack.config.js` – Webpack bundler config
