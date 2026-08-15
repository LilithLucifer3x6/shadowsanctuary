let ttsEnabled = localStorage.getItem('tts_enabled') === 'true';
let ttsRate = parseFloat(localStorage.getItem('tts_rate')) || 1.0;
let ttsPitch = parseFloat(localStorage.getItem('tts_pitch')) || 1.0;
let ttsVoiceURI = localStorage.getItem('tts_voice_uri') || '';

export function getTtsEnabled() { return ttsEnabled; }
export function getTtsRate() { return ttsRate; }
export function getTtsPitch() { return ttsPitch; }
export function getTtsVoiceURI() { return ttsVoiceURI; }

export function setTtsEnabled(enabled) {
  ttsEnabled = !!enabled;
  localStorage.setItem('tts_enabled', ttsEnabled);
  document.querySelectorAll('.spk').forEach(el => el.style.display = ttsEnabled ? '' : 'none');
}

export function setTtsRate(rate) {
  ttsRate = rate;
  localStorage.setItem('tts_rate', rate);
}

export function setTtsPitch(pitch) {
  ttsPitch = pitch;
  localStorage.setItem('tts_pitch', pitch);
}

export function setTtsVoiceURI(uri) {
  ttsVoiceURI = uri;
  localStorage.setItem('tts_voice_uri', uri);
}

export function getFeminineVoices() {
  if (!window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  
  return voices
    .filter(v => /^en/i.test(v.lang) && !/male\b/i.test(v.name))
    .map(v => {
      return { ...v, displayName: v.name, voiceURI: v.voiceURI };
    });
}

export function speak(text) {
  if (!ttsEnabled || !window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = ttsRate;
  utterance.pitch = ttsPitch;
  
  const voices = window.speechSynthesis.getVoices();
  if (ttsVoiceURI) {
    const selectedVoice = voices.find(v => v.voiceURI === ttsVoiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function createSpeakerButton(text) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'spk';
  
  import('./custom-icons.jsx').then(({ ic }) => {
    btn.innerHTML = ic('speaker-high');
  });
  
  if (!window.speechSynthesis || !ttsEnabled) {
    btn.style.display = 'none';
  }
  if (!window.speechSynthesis) return btn;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    speak(text);
  });
  
  return btn;
}

export function speakerMarkup(text) {
  if (!window.speechSynthesis) return '';
  return `<button type="button" class="spk" style="${ttsEnabled ? '' : 'display:none;'}" onclick="window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('${text.replace(/'/g, "\\'")}'); u.rate = ${ttsRate}; u.pitch = ${ttsPitch}; const v = window.speechSynthesis.getVoices().find(x => x.voiceURI === '${ttsVoiceURI}'); if(v) u.voice = v; window.speechSynthesis.speak(u);"><span dangerouslySetInnerHTML="true"></span><span class="cic"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M160,51.71V204.29a8,8,0,0,1-13.44,5.86l-67.63-63.51H32a8,8,0,0,1-8-8V117.36a8,8,0,0,1,8-8H78.93l67.63-63.51A8,8,0,0,1,160,51.71ZM192,128a55.94,55.94,0,0,0-16.38-39.6,8,8,0,0,0-11.33,11.32A40,40,0,0,1,176,128a40,40,0,0,1-11.71,28.28,8,8,0,0,0,11.33,11.32A55.94,55.94,0,0,0,192,128Zm56,0a87.91,87.91,0,0,0-25.75-62.22,8,8,0,0,0-11.31,11.31A72,72,0,0,1,232,128a72,72,0,0,1-21.06,50.91,8,8,0,0,0,11.31,11.31A87.91,87.91,0,0,0,248,128Z"/></svg></span></button>`;
}

