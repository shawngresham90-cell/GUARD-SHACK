const $ = (id) => document.getElementById(id);
const state = { file: null, sceneId: 'jackknife', analysis: null, photoUrl: null };

const dz = $('dropzone');
const photoInput = $('photo');
const preview = $('preview');
const dzLabel = $('dropzoneLabel');

dz.addEventListener('click', () => photoInput.click());
['dragenter', 'dragover'].forEach((e) =>
  dz.addEventListener(e, (ev) => { ev.preventDefault(); dz.classList.add('drag'); })
);
['dragleave', 'drop'].forEach((e) =>
  dz.addEventListener(e, (ev) => { ev.preventDefault(); dz.classList.remove('drag'); })
);
dz.addEventListener('drop', (ev) => {
  const f = ev.dataTransfer.files?.[0];
  if (f) setFile(f);
});
photoInput.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) setFile(f);
});

function setFile(f) {
  state.file = f;
  const url = URL.createObjectURL(f);
  preview.src = url;
  dzLabel.textContent = f.name;
}

async function loadScenes() {
  const res = await fetch('/api/scenes');
  const scenes = await res.json();
  const wrap = $('scenes');
  wrap.innerHTML = '';
  scenes.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'scene-btn' + (i === 0 ? ' active' : '');
    btn.dataset.id = s.id;
    btn.innerHTML = `<b>${s.id.replace(/_/g, ' ')}</b><span>${s.desc}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.sceneId = s.id;
    });
    wrap.appendChild(btn);
  });
}
loadScenes();

function setStatus(el, msg, kind = '') {
  el.textContent = msg;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

$('analyzeBtn').addEventListener('click', async () => {
  const status = $('status');
  setStatus(status, 'Sending to Grok…');
  try {
    const fd = new FormData();
    if (state.file) fd.append('photo', state.file);
    fd.append('sceneId', state.sceneId);
    fd.append('extraNotes', $('notes').value || '');
    const res = await fetch('/api/analyze', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'analyze failed');
    state.analysis = data;
    state.photoUrl = data.photoUrl;
    renderAnalysis(data);
    $('generateBtn').disabled = false;
    setStatus(status, 'Prompt ready. Click "Make 10s Clip" to render.', 'ok');
  } catch (e) {
    setStatus(status, e.message, 'err');
  }
});

function renderAnalysis(d) {
  $('resultCard').hidden = false;
  $('caption').textContent = d.caption || '';
  $('hashtags').textContent = (d.hashtags || []).map((h) => '#' + h).join(' ');
  $('videoPrompt').textContent = d.video_prompt || '';
  $('negativePrompt').textContent = d.negative_prompt || '';
  $('observed').textContent = d.observed || '';
  const ul = $('hookVariants');
  ul.innerHTML = '';
  (d.hook_variants || []).forEach((h) => {
    const li = document.createElement('li');
    li.textContent = h;
    ul.appendChild(li);
  });
  document.querySelectorAll('.copyable').forEach((el) => {
    el.onclick = async () => {
      await navigator.clipboard.writeText(el.textContent);
      const orig = el.style.borderColor;
      el.style.borderColor = 'var(--good)';
      setTimeout(() => (el.style.borderColor = orig), 600);
    };
  });
}

$('generateBtn').addEventListener('click', async () => {
  if (!state.analysis) return;
  const vs = $('videoStatus');
  $('videoCard').hidden = false;
  setStatus(vs, 'Submitting to video provider…');
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_prompt: state.analysis.video_prompt,
        negative_prompt: state.analysis.negative_prompt,
        photoUrl: state.photoUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'generate failed');
    pollJob(data.jobId);
  } catch (e) {
    setStatus(vs, e.message, 'err');
  }
});

async function pollJob(jobId) {
  const vs = $('videoStatus');
  const player = $('videoPlayer');
  const raw = $('rawJob');
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch('/api/job/' + jobId);
    const j = await res.json();
    raw.textContent = JSON.stringify(j, null, 2);
    setStatus(vs, `status: ${j.status}`);
    if (j.status === 'done' && j.video_url) {
      player.src = j.video_url;
      setStatus(vs, 'Clip ready.', 'ok');
      return;
    }
    if (j.status === 'error') {
      setStatus(vs, j.error || 'failed', 'err');
      return;
    }
    if (j.status === 'submitted' && !j.video_url) {
      setStatus(vs, 'Provider accepted job; check raw output below for the polling URL or media link.', 'ok');
      return;
    }
  }
  setStatus(vs, 'Timed out waiting for provider.', 'err');
}
