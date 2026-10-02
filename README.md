# Spfive Book Reader — JMA WebApp Format

Files included:
- index.html
- app.js
- style.css
- manifest.json
- service-worker.js
- icon-192.png
- icon-512.png

## GitHub Pages
1. Create a GitHub repository.
2. Upload every file from this folder.
3. Open Settings > Pages.
4. Select the main branch and root folder.
5. Open the GitHub Pages link in Safari.
6. Tap Share > Add to Home Screen.

## Reading
- Open a TXT/TEXT book.
- Press Play.
- Use Play/Pause, back/forward chunks, reading speed, and reader view.

## iPhone background limitation
This is a WebApp/PWA using the browser Speech Synthesis API.
iOS Safari may pause or stop Text-to-Speech after the WebApp is backgrounded or the phone is locked.
Media Session controls are included where supported, but a WebApp cannot guarantee continuous background speech.
For reliable background spoken-book playback, use the native iPhone version.

## PDF
This lightweight GitHub version does not bundle a PDF text extraction library.
Use TXT/TEXT for the WebApp. The native iPhone version supports text-based PDF.


## PDF update
This version can open text-based PDF files directly in the WebApp using PDF.js.
When you select a PDF, the app extracts the text page by page and then reads it aloud.

Important:
- The first load needs internet access so the PDF.js library can load.
- Normal text PDFs work.
- Scanned/photo-only PDFs still need OCR.
- iPhone WebApp background Text-to-Speech remains subject to iOS browser limitations.


## Page selector update
For PDF files:
- Enter any page number.
- Use Prev / Next to move one page at a time.
- Tap **Read This Page** to read only that page.
- Tap **Read From This Page** to start at that page and continue through the rest of the PDF.
