import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });

const {
  XAI_API_KEY,
  GROK_VISION_MODEL = 'grok-2-vision-1212',
  GROK_TEXT_MODEL = 'grok-2-1212',
  VIDEO_API_URL = 'https://api.x.ai/v1/video/generations',
  VIDEO_API_KEY,
  VIDEO_MODEL = 'grok-video-1',
  VIDEO_DURATION_SECONDS = '10',
  PORT = 3000,
} = process.env;

const XAI_BASE = 'https://api.x.ai/v1';
const JOBS = new Map();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/output', express.static(path.join(__dirname, 'output')));

function requireKey(res) {
  if (!XAI_API_KEY) {
    res.status(500).json({ error: 'XAI_API_KEY is not set. Copy .env.example to .env and add your key.' });
    return false;
  }
  return true;
}

async function grokChat({ model, messages, response_format }) {
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, response_format, temperature: 0.9 }),
  });
  if (!res.ok) throw new Error(`grok ${model} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

const SCENE_LIBRARY = {
  jackknife: 'A semi-truck jackknifing on a wet highway, trailer swinging out 90 degrees, smoke from locked tires',
  rollover: 'A loaded semi rolling over on an off-ramp, cargo spilling, sparks against the asphalt',
  rearend: 'A semi rear-ending stopped traffic at full highway speed, hood crumpling, debris flying',
  merge_fail: 'A semi cutting across three lanes without looking, sedan swerving onto the shoulder at the last second',
  bridge_strike: 'An overheight semi slamming into a low bridge, trailer roof peeling back like a sardine can',
  road_rage: 'A road-rage standoff: pickup brake-checks a semi, semi locks brakes, smoke billows',
  ice_slide: 'A semi sliding sideways down an icy mountain pass past stranded cars',
  blowout: 'A front-tire blowout at 70mph, semi veering into the median, dust cloud erupting',
  lost_load: 'Cargo straps snapping, full pallet of goods bouncing off the trailer onto the freeway',
  construction: 'A semi clipping a construction barrel wall at speed, orange barrels exploding everywhere',
};

app.get('/api/scenes', (_req, res) => {
  res.json(Object.entries(SCENE_LIBRARY).map(([id, desc]) => ({ id, desc })));
});

app.post('/api/analyze', upload.single('photo'), async (req, res) => {
  if (!requireKey(res)) return;
  try {
    const { sceneId = 'jackknife', extraNotes = '' } = req.body;
    const sceneDesc = SCENE_LIBRARY[sceneId] ?? SCENE_LIBRARY.jackknife;

    let imageDataUrl = null;
    let publicPhotoUrl = null;
    if (req.file) {
      const buf = await fs.readFile(req.file.path);
      const mime = req.file.mimetype || 'image/jpeg';
      imageDataUrl = `data:${mime};base64,${buf.toString('base64')}`;
      publicPhotoUrl = `/uploads/${path.basename(req.file.path)}`;
    }

    const visionMessages = [
      {
        role: 'system',
        content:
          'You are a viral short-form video director specializing in dashcam fail content. ' +
          'Given a real photo and a target failure scenario, you write a single hyper-cinematic ' +
          '10-second video prompt that preserves the real-world details (truck color, weather, ' +
          'road, time of day, plate region if visible) but evolves the scene into the requested ' +
          'failure. Output strict JSON.',
      },
      {
        role: 'user',
        content: [
          imageDataUrl
            ? { type: 'image_url', image_url: { url: imageDataUrl } }
            : { type: 'text', text: '(no photo attached — invent realistic details)' },
          {
            type: 'text',
            text:
              `Target failure: ${sceneDesc}\n` +
              (extraNotes ? `Extra notes: ${extraNotes}\n` : '') +
              `Return JSON with keys:\n` +
              `  observed: short description of what's actually in the photo\n` +
              `  video_prompt: ONE paragraph, ~80 words, dashcam POV, 10 seconds, second-by-second beats, camera shake, audio cues\n` +
              `  negative_prompt: things to avoid (cartoonish, watermarks, text overlays, etc.)\n` +
              `  caption: 1-line viral hook caption (<=120 chars)\n` +
              `  hashtags: array of 8-12 hashtags, no # prefix\n` +
              `  hook_variants: array of 3 alternate caption hooks`,
          },
        ],
      },
    ];

    const raw = await grokChat({
      model: GROK_VISION_MODEL,
      messages: visionMessages,
      response_format: { type: 'json_object' },
    });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { video_prompt: raw, caption: '', hashtags: [], hook_variants: [], negative_prompt: '' };
    }

    res.json({ ...parsed, photoUrl: publicPhotoUrl, sceneId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

async function generateVideo({ prompt, negativePrompt, photoUrl }) {
  const key = VIDEO_API_KEY || XAI_API_KEY;
  const body = {
    model: VIDEO_MODEL,
    prompt,
    negative_prompt: negativePrompt,
    duration_seconds: Number(VIDEO_DURATION_SECONDS),
    aspect_ratio: '9:16',
    init_image_url: photoUrl || undefined,
  };
  const res = await fetch(VIDEO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`video provider ${res.status}: ${text}`);
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return data;
}

app.post('/api/generate', async (req, res) => {
  if (!requireKey(res)) return;
  const { video_prompt, negative_prompt = '', photoUrl = '' } = req.body || {};
  if (!video_prompt) return res.status(400).json({ error: 'video_prompt required' });

  const jobId = crypto.randomBytes(8).toString('hex');
  JOBS.set(jobId, { status: 'queued', createdAt: Date.now() });

  (async () => {
    try {
      JOBS.set(jobId, { status: 'submitting', createdAt: Date.now() });
      const absPhoto = photoUrl ? `${req.protocol}://${req.get('host')}${photoUrl}` : '';
      const result = await generateVideo({
        prompt: video_prompt,
        negativePrompt: negative_prompt,
        photoUrl: absPhoto,
      });
      const url =
        result.video_url ||
        result.url ||
        result.data?.[0]?.url ||
        result.output?.[0]?.url ||
        null;
      JOBS.set(jobId, { status: url ? 'done' : 'submitted', result, video_url: url, finishedAt: Date.now() });
    } catch (err) {
      JOBS.set(jobId, { status: 'error', error: String(err.message || err) });
    }
  })();

  res.json({ jobId });
});

app.get('/api/job/:id', (req, res) => {
  const job = JOBS.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json(job);
});

app.post('/api/captions', async (req, res) => {
  if (!requireKey(res)) return;
  const { observed = '', sceneId = '' } = req.body || {};
  try {
    const raw = await grokChat({
      model: GROK_TEXT_MODEL,
      messages: [
        { role: 'system', content: 'You write viral TikTok/Reels/Shorts captions for dashcam semi-truck fail clips. JSON only.' },
        { role: 'user', content:
            `Scene: ${sceneId}. Observed: ${observed}.\n` +
            `Return JSON: { titles: [5 short titles], captions: [5 captions <=120 chars], hashtags: [12 hashtags no #] }` },
      ],
      response_format: { type: 'json_object' },
    });
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`dashcam content machine on http://localhost:${PORT}`);
  if (!XAI_API_KEY) console.warn('!! XAI_API_KEY missing — copy .env.example to .env');
});
