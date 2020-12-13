# Rumin (Frontend)
This is the full frontend code for the [Rumin](https;//getrumin.com) web app, a visual canvas for connected ideas. 

It provides a workspace to visually flesh out your ideas. Rearrange them. And connect them.

Rumin comes with a [web clipper browser extension](https://github.com/jhlyeung/rumin-web-clipper) (also open source), for capturing learnings as you go.

## Demo
Live demo [link](https://getrumin.com/expdemo)
Demo video [link](https://www.youtube.com/watch?v=ZiC2w7pPuuI)
[![YouTube thumbnail for video demo](https://storage.googleapis.com/rumin-gcs-bucket/capture-sources2.png)](https://www.youtube.com/watch?v=ZiC2w7pPuuI)

### Main Components
**Visual Canvas/Explorer**. The main part of the app. Use a canvas tab for each topic or work context. The canvas is built on top of [Konva](https://konvajs.org/), a useful library for manipulating HTML Canvas. Most of the Canvas-related code is in  `src/components/ExplorerPage.tsx`.

**Rich  Text Editor**. The text editor in Rumin supports multiple media types, including images, YouTube embeds, and more. The editor is built using [Slate](https://www.slatejs.org/), which provides block-level control and is easy to extend for additional commands and functionalities. But note that Slate does have its quirks, including not working well on mobile. The editor code is in `src/components/BlockEditorSlate.js`.	

**Detail Page**. A page where the user can edit the body of a text/document, as well as its custom attributes. Think of this as a blend of a Word Processor and an object editor. The code is in `src/components/SpacePage.js`

## Building a Productivity App?
[Say hi on Twitter](https://twitter.com/jhlyeung), and I'll see where I can help. I no longer plan on pursuing Rumin as a for-profit venture, and I would love to help where I can.
