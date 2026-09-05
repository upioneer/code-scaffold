---
​‌‍name: revealjs
description: Comprehensive toolkit and knowledge base for scaffolding, configuring, and exporting Reveal.js presentations.
---

# Reveal.js Skill

This skill provides the intelligence and instructions needed to build, configure, and customize Reveal.js presentations.

## 1. Installation & Setup

Reveal.js can be set up in three main ways:

### Basic Setup
The easiest approach, requiring no build tools.
* Download the Reveal.js ZIP or clone the repository.
* Open `index.html` directly in a browser.

### Full Setup
Ideal for running external markdown and making source changes.
* Clone the repository: `git clone https://github.com/hakimel/reveal.js.git`
* Install dependencies: `npm install`
* Run the dev server: `npm start` (Runs on `http://localhost:8000` by default).

### Package Manager (npm/yarn)
Ideal for integrating Reveal.js into existing modern web apps (React, Vue, etc.).
* Run `npm install reveal.js`
* Import in JavaScript:
  ```js
  import Reveal from 'reveal.js';
  import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
  import 'reveal.js/dist/reveal.css';
  import 'reveal.js/dist/theme/black.css';

  let deck = new Reveal({
    plugins: [ Markdown ]
  });
  deck.initialize();
  ```

## 2. Core Markup & Layouts

### HTML Structure
The presentation requires a specific nested structure:
```html
<div class="reveal">
  <div class="slides">
    <section>Slide 1</section>
    <section>Slide 2</section>
  </div>
</div>
```

### Vertical Slides
Nest `<section>` tags to create vertical stacks:
```html
<section>
  <section>Horizontal Slide</section>
  <section>Vertical Slide 1</section>
  <section>Vertical Slide 2</section>
</section>
```

### Markdown Content
Use the `data-markdown` attribute on sections. For external files, use `data-markdown="path/to/file.md"`.
```html
<section data-markdown>
  <textarea data-template>
    ## Slide Title
    * Bullet 1
    * Bullet 2
  </textarea>
</section>
```

### Backgrounds
Use `data-background-color`, `data-background-image`, or `data-background-video` on a `<section>` to customize its background.

## 3. Layouts & Auto Animate

Reveal.js provides helper classes for layouts:
* `r-fit-text`: Automatically sizes text to fit the slide horizontally.
* `r-stretch`: Automatically scales an element to fill remaining vertical space.
* `r-stack`: Centers multiple elements on top of each other.

### Auto Animate
Add `data-auto-animate` to two adjacent `<section>` elements to automatically animate elements that match between them.

## 4. Animations & Transitions

Configure global transitions via `Reveal.initialize({ transition: 'fade' })` or per slide using `data-transition="slide"`.
Available transitions: `none`, `fade`, `slide`, `convex`, `concave`, `zoom`.

### Fragments
Use the `.fragment` class to step through elements sequentially:
```html
<p class="fragment">First</p>
<p class="fragment">Second</p>
```

## 5. Plugins & API

### Core Plugins
* `RevealMarkdown`
* `RevealHighlight` (Syntax highlighting)
* `RevealNotes` (Speaker notes via `<aside class="notes">`)
* `RevealSearch`
* `RevealZoom`
* `RevealMath`

### API Interaction
Access the API globally via `Reveal` (if loaded via script tag) or the instantiated `deck` object:
* `Reveal.slide(indexh, indexv)`: Jump to a specific slide.
* `Reveal.next()` / `Reveal.prev()`: Navigation.
* Events: `Reveal.on('slidechanged', event => { ... })`.

## 6. Customization

Tweak the presentation in the initialization config:
```js
Reveal.initialize({
  controls: true,
  progress: true,
  history: true,
  center: true,
  hash: true,
  transition: 'slide'
});
```
Themes are loaded via CSS (e.g. `black.css`, `white.css`, `dracula.css`).

## 7. Exporting Workflows

### PDF Export
* Append `?print-pdf` to the presentation URL (e.g. `http://localhost:8000/?print-pdf`).
* Open the browser's print dialog (CTRL/CMD + P).
* Set destination to "Save as PDF".
* Set Margins to "None".
* Check "Background graphics".

## 8. Known Issues & Best Practices

* **Autoplay Media**: Add `data-autoplay` to `<video>` and `<audio>` elements if they should start automatically on slide entry.
* **Markdown Indentation**: Use `<textarea data-template>` inside `data-markdown` sections to avoid indentation issues in HTML.
* **Speaker View**: Requires running a local web server (cannot use `file://` protocol). Press `S` to open the speaker console.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
