const filePicker = document.getElementById('filePicker');
const bookTitle = document.getElementById('bookTitle');
const bookTitleHero = document.getElementById('bookTitleHero');
const bookMeta = document.getElementById('bookMeta');
const bookType = document.getElementById('bookType');
const readerText = document.getElementById('readerText');
const readerPanel = document.getElementById('readerPanel');
const readerBtn = document.getElementById('readerBtn');
const closeReader = document.getElementById('closeReader');
const playBtn = document.getElementById('playBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const speedBtn = document.getElementById('speedBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusText = document.getElementById('statusText');
const pageControls = document.getElementById('pageControls');
const pageInput = document.getElementById('pageInput');
const pageTotal = document.getElementById('pageTotal');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const goPageBtn = document.getElementById('goPageBtn');
const readFromPageBtn = document.getElementById('readFromPageBtn');

let text = '';
let title = 'Open a Book';
let chunks = [];
let chunkIndex = 0;
let speaking = false;
let paused = false;
let rate = 1.0;
let voices = [];
let pdfPages = [];
let currentPage = 1;
let isPdf = false;

function loadVoices(){
  voices = speechSynthesis.getVoices();
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function chooseVoice(){
  const preferred = voices.find(v => v.lang === 'en-IE')
    || voices.find(v => v.lang === 'en-GB')
    || voices.find(v => v.lang.startsWith('en'));
  return preferred || null;
}

function makeChunks(source){
  const normalized = source.replace(/\s+/g,' ').trim();
  const out = [];
  const max = 800;
  let i = 0;
  while(i < normalized.length){
    let end = Math.min(i + max, normalized.length);
    if(end < normalized.length){
      const punct = Math.max(
        normalized.lastIndexOf('. ', end),
        normalized.lastIndexOf('? ', end),
        normalized.lastIndexOf('! ', end),
        normalized.lastIndexOf('; ', end)
      );
      if(punct > i + 250) end = punct + 1;
    }
    out.push(normalized.slice(i,end));
    i = end;
  }
  return out;
}

function setProgress(){
  const pct = chunks.length ? Math.min(100, Math.round((chunkIndex / chunks.length) * 100)) : 0;
  progressBar.style.width = pct + '%';
  progressText.textContent = pct + '%';
}

function speakCurrent(){
  if(!text) return;
  if(chunkIndex >= chunks.length){
    speaking = false; paused = false;
    playBtn.textContent = '▶';
    statusText.textContent = 'FINISHED';
    progressBar.style.width = '100%';
    progressText.textContent = '100%';
    return;
  }

  const u = new SpeechSynthesisUtterance(chunks[chunkIndex]);
  u.rate = rate;
  const voice = chooseVoice();
  if(voice) u.voice = voice;

  u.onstart = () => {
    speaking = true; paused = false;
    playBtn.textContent = '⏸';
    statusText.textContent = 'READING';
    updateMediaSession();
  };
  u.onend = () => {
    if(!paused){
      chunkIndex++;
      setProgress();
      speakCurrent();
    }
  };
  u.onerror = () => {
    speaking = false;
    playBtn.textContent = '▶';
    statusText.textContent = 'STOPPED';
  };

  speechSynthesis.speak(u);
}

function startOrToggle(){
  if(!text){ filePicker.click(); return; }

  if(speaking && !paused){
    speechSynthesis.pause();
    paused = true;
    speaking = false;
    playBtn.textContent = '▶';
    statusText.textContent = 'PAUSED';
  }else if(paused){
    speechSynthesis.resume();
    paused = false;
    speaking = true;
    playBtn.textContent = '⏸';
    statusText.textContent = 'READING';
  }else{
    speechSynthesis.cancel();
    speakCurrent();
  }
  updateMediaSession();
}

function stopReading(){
  speechSynthesis.cancel();
  speaking = false;
  paused = false;
  playBtn.textContent = '▶';
  statusText.textContent = 'READY';
}

function updateMediaSession(){
  if(!('mediaSession' in navigator)) return;
  try{
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist:'Spfive Book Reader',
      album:'Books Come To Life',
      artwork:[
        {src:'icon-192.png',sizes:'192x192',type:'image/png'},
        {src:'icon-512.png',sizes:'512x512',type:'image/png'}
      ]
    });
    navigator.mediaSession.playbackState = speaking ? 'playing' : 'paused';
  }catch(e){}
}

if('mediaSession' in navigator){
  const safe = (action, handler) => {
    try{ navigator.mediaSession.setActionHandler(action, handler); }catch(e){}
  };
  safe('play', () => {
    if(paused) { speechSynthesis.resume(); paused=false; speaking=true; }
    else if(!speaking) speakCurrent();
    playBtn.textContent='⏸'; statusText.textContent='READING'; updateMediaSession();
  });
  safe('pause', () => {
    speechSynthesis.pause(); paused=true; speaking=false;
    playBtn.textContent='▶'; statusText.textContent='PAUSED'; updateMediaSession();
  });
  safe('stop', stopReading);
}

playBtn.addEventListener('click', startOrToggle);

backBtn.addEventListener('click', () => {
  speechSynthesis.cancel();
  chunkIndex = Math.max(0, chunkIndex - 1);
  setProgress();
  speaking = false; paused = false;
  if(text) speakCurrent();
});

forwardBtn.addEventListener('click', () => {
  speechSynthesis.cancel();
  chunkIndex = Math.min(chunks.length, chunkIndex + 1);
  setProgress();
  speaking = false; paused = false;
  if(text) speakCurrent();
});

speedBtn.addEventListener('click', () => {
  const speeds = [1,1.2,1.5,0.8];
  const labels = ['1×','1.2×','1.5×','0.8×'];
  let idx = speeds.findIndex(s => Math.abs(s-rate)<0.01);
  idx = (idx + 1) % speeds.length;
  rate = speeds[idx];
  speedBtn.textContent = labels[idx];
});

readerBtn.addEventListener('click', () => {
  if(text) readerPanel.classList.remove('hidden');
});
closeReader.addEventListener('click', () => readerPanel.classList.add('hidden'));


function clampPage(value){
  if(!pdfPages.length) return 1;
  const n = Number(value) || 1;
  return Math.min(pdfPages.length, Math.max(1, Math.floor(n)));
}

function updatePageUI(){
  if(!isPdf || !pdfPages.length){
    pageControls.classList.add('hidden');
    return;
  }
  pageControls.classList.remove('hidden');
  currentPage = clampPage(currentPage);
  pageInput.value = currentPage;
  pageInput.max = pdfPages.length;
  pageTotal.textContent = `of ${pdfPages.length}`;
}

function prepareTextForSelection(selectedText){
  stopReading();
  text = selectedText;
  chunks = makeChunks(text);
  chunkIndex = 0;
  readerText.textContent = text;
  setProgress();
  statusText.textContent = 'READY';
  updateMediaSession();
}

function readSelectedPage(){
  if(!isPdf || !pdfPages.length) return;
  currentPage = clampPage(pageInput.value);
  updatePageUI();

  const pageText = pdfPages[currentPage - 1] || '';
  if(!pageText.trim()){
    alert(`Page ${currentPage} has no readable text.`);
    return;
  }

  prepareTextForSelection(pageText);
  bookMeta.textContent = `Page ${currentPage} of ${pdfPages.length} • PDF`;
  setTimeout(() => startOrToggle(), 50);
}

function readFromSelectedPage(){
  if(!isPdf || !pdfPages.length) return;
  currentPage = clampPage(pageInput.value);
  updatePageUI();

  const selected = pdfPages.slice(currentPage - 1).join('\n\n');
  if(!selected.trim()){
    alert(`No readable text found from page ${currentPage}.`);
    return;
  }

  prepareTextForSelection(selected);
  bookMeta.textContent = `Reading from page ${currentPage} of ${pdfPages.length}`;
  setTimeout(() => startOrToggle(), 50);
}

prevPageBtn.addEventListener('click', () => {
  if(!pdfPages.length) return;
  currentPage = clampPage((Number(pageInput.value) || currentPage) - 1);
  updatePageUI();
});

nextPageBtn.addEventListener('click', () => {
  if(!pdfPages.length) return;
  currentPage = clampPage((Number(pageInput.value) || currentPage) + 1);
  updatePageUI();
});

pageInput.addEventListener('change', () => {
  currentPage = clampPage(pageInput.value);
  updatePageUI();
});

goPageBtn.addEventListener('click', readSelectedPage);
readFromPageBtn.addEventListener('click', readFromSelectedPage);


filePicker.addEventListener('change', async () => {
  const file = filePicker.files[0];
  if(!file) return;

  stopReading();
  title = file.name.replace(/\.[^.]+$/,'');
  const ext = file.name.split('.').pop().toLowerCase();
  isPdf = ext === 'pdf';
  pdfPages = [];
  currentPage = 1;

  if(ext === 'txt' || ext === 'text'){
    text = await file.text();
    pageControls.classList.add('hidden');
  } else if(ext === 'pdf'){
    try {
      if(typeof pdfjsLib === 'undefined'){
        alert('PDF reader library did not load. Please check your internet connection and reopen the app.');
        return;
      }

      statusText.textContent = 'LOADING PDF';
      bookMeta.textContent = 'Extracting PDF text…';

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data: buffer}).promise;
      const pages = [];

      for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++){
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        pdfPages.push(pageText);
        if(pageText) pages.push(pageText);

        const loadPct = Math.round((pageNumber / pdf.numPages) * 100);
        progressBar.style.width = loadPct + '%';
        progressText.textContent = loadPct + '%';
      }

      text = pages.join('\n\n');

      if(!text.trim()){
        alert('No readable text was found in this PDF. It may be a scanned/image-only PDF.');
        statusText.textContent = 'READY';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        return;
      }

      bookMeta.textContent = `${pdf.numPages} page PDF • Choose a page`;
      updatePageUI();
    } catch(err) {
      console.error(err);
      alert('I could not read this PDF. Please try another PDF. Scanned/image PDFs need OCR.');
      statusText.textContent = 'READY';
      return;
    }
  } else {
    alert('Unsupported file type.');
    return;
  }

  chunks = makeChunks(text);
  chunkIndex = 0;

  bookTitle.textContent = title;
  bookTitleHero.textContent = title.toUpperCase();
  if(ext !== 'pdf') bookMeta.textContent = 'Text-to-Speech Book';
  bookType.textContent = ext.toUpperCase() + ' • READY TO READ';
  readerText.textContent = text;
  statusText.textContent = 'READY';
  setProgress();
  updateMediaSession();
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
}
