import http from 'node:http';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import tls from 'node:tls';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contact-submissions.json');
const PORT = Number(process.env.PORT || 3000);
const WEBHOOK = process.env.CONTACT_WEBHOOK_URL || '';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || EMAIL_USER;

await mkdir(DATA_DIR, { recursive: true });
if (!existsSync(CONTACTS_FILE)) await writeFile(CONTACTS_FILE, '[]', 'utf8');

const rate = new Map();
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

function headers(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
  };
}

function json(res, status, data) {
  res.writeHead(status, headers());
  res.end(JSON.stringify(data));
}

function normalizeText(value, max = 2000) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 180;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function headerSafe(value = '') {
  return String(value).replace(/[\r\n]+/g, ' ').trim();
}

function readSmtpResponse(socket, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('SMTP_TIMEOUT'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function onData(chunk) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n').filter(Boolean);
      const last = lines.at(-1) || '';
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve({ code: Number(last.slice(0, 3)), text: buffer });
      }
    }

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function smtpCommand(socket, command, expectedCodes) {
  if (command !== null) socket.write(command + '\r\n');
  const response = await readSmtpResponse(socket);
  const allowed = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
  if (!allowed.includes(response.code)) {
    throw new Error(`SMTP_${response.code}: ${response.text.trim().slice(0, 500)}`);
  }
  return response;
}

async function sendContactEmail(submission) {
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD || !CONTACT_TO_EMAIL) return false;

  const socket = tls.connect({
    host: 'smtp.gmail.com',
    port: 465,
    servername: 'smtp.gmail.com',
    rejectUnauthorized: true
  });

  await new Promise((resolve, reject) => {
    socket.once('secureConnect', resolve);
    socket.once('error', reject);
    socket.setTimeout(15000, () => {
      socket.destroy();
      reject(new Error('SMTP_SOCKET_TIMEOUT'));
    });
  });

  try {
    await smtpCommand(socket, null, 220);
    await smtpCommand(socket, 'EHLO lualu-site', 250);
    await smtpCommand(socket, 'AUTH LOGIN', 334);
    await smtpCommand(socket, Buffer.from(EMAIL_USER).toString('base64'), 334);
    await smtpCommand(socket, Buffer.from(EMAIL_APP_PASSWORD).toString('base64'), 235);
    await smtpCommand(socket, `MAIL FROM:<${EMAIL_USER}>`, 250);
    await smtpCommand(socket, `RCPT TO:<${CONTACT_TO_EMAIL}>`, [250, 251]);
    await smtpCommand(socket, 'DATA', 354);

    const subject = `Novo contato pelo site | ${headerSafe(submission.name)}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
    const body = [
      'Novo contato recebido pelo site da Lua Lu',
      '',
      `Nome: ${submission.name}`,
      `E-mail: ${submission.email}`,
      `Marca / negócio: ${submission.brand || 'Não informado'}`,
      `Tipo de projeto: ${submission.projectType || 'Não informado'}`,
      '',
      'Mensagem:',
      submission.message
    ].join('\r\n').replace(/^\./gm, '..');

    const message = [
      `From: Lua Lu <${EMAIL_USER}>`,
      `To: ${CONTACT_TO_EMAIL}`,
      `Reply-To: ${headerSafe(submission.email)}`,
      `Subject: ${encodedSubject}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body
    ].join('\r\n');

    socket.write(message + '\r\n.\r\n');
    const sent = await readSmtpResponse(socket);
    if (sent.code !== 250) throw new Error(`SMTP_${sent.code}: ${sent.text.trim().slice(0, 500)}`);

    socket.write('QUIT\r\n');
    return true;
  } finally {
    socket.end();
  }
}

async function collectBody(req, maxBytes = 50_000) {
  return await new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { reject(new Error('PAYLOAD_TOO_LARGE')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function allowContact(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const entries = (rate.get(ip) || []).filter(t => now - t < windowMs);
  if (entries.length >= 5) return false;
  entries.push(now); rate.set(ip, entries); return true;
}

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'Lua Lu' });

  if (req.method === 'GET' && url.pathname === '/api/projects') {
    const projects = await readJson(PROJECTS_FILE);
    return json(res, 200, projects.map(({ context, challenge, insight, process, result, ...card }) => card));
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/projects/')) {
    const slug = decodeURIComponent(url.pathname.split('/').pop());
    const projects = await readJson(PROJECTS_FILE);
    const project = projects.find(p => p.slug === slug);
    return project ? json(res, 200, project) : json(res, 404, { error: 'Projeto não encontrado.' });
  }

  if (req.method === 'POST' && url.pathname === '/api/contact') {
    const ip = req.socket.remoteAddress || 'unknown';
    if (!allowContact(ip)) return json(res, 429, { error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    let payload;
    try { payload = JSON.parse(await collectBody(req)); }
    catch (error) { return json(res, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'Dados inválidos.' }); }

    if (payload.website) return json(res, 200, { ok: true });
    const name = normalizeText(payload.name, 120);
    const email = normalizeText(payload.email, 180);
    const brand = normalizeText(payload.brand, 160);
    const projectType = normalizeText(payload.projectType, 120);
    const message = normalizeText(payload.message, 3000);

    if (name.length < 2 || !validEmail(email) || message.length < 15) {
      return json(res, 422, { error: 'Preencha nome, e-mail válido e conte um pouco mais sobre o projeto.' });
    }

    const submission = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name,
      email,
      brand,
      projectType,
      message
    };

    let delivered = false;

    if (EMAIL_USER && EMAIL_APP_PASSWORD && CONTACT_TO_EMAIL) {
      try {
        delivered = await sendContactEmail(submission);
      } catch (error) {
        console.error('Falha ao enviar contato por Gmail SMTP:', error.message);
        return json(res, 502, { error: 'Não foi possível enviar sua mensagem agora. Tente novamente em alguns minutos.' });
      }
    }

    if (!delivered) {
      const submissions = await readJson(CONTACTS_FILE);
      submissions.push(submission);
      await writeFile(CONTACTS_FILE, JSON.stringify(submissions, null, 2), 'utf8');
    }

    if (WEBHOOK) {
      try {
        await fetch(WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        });
      } catch (error) {
        await appendFile(path.join(DATA_DIR, 'webhook-errors.log'), `${new Date().toISOString()} ${error.message}\n`);
      }
    }

    return json(res, 201, {
      ok: true,
      message: delivered
        ? 'Mensagem enviada. Obrigada por contar seu projeto.'
        : 'Mensagem recebida. Obrigada por contar seu projeto.'
    });
  }

  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Endpoint não encontrado.' });
  return false;
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/projetos' || pathname === '/projetos/') pathname = '/projetos.html';
  if (/^\/projetos\/[^/]+\/?$/.test(pathname)) pathname = '/projeto.html';
  if (pathname === '/contato' || pathname === '/contato/') pathname = '/index.html';

  const normalized = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized);
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'Acesso negado.' });

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      ...headers(MIME[ext] || 'application/octet-stream'),
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(body);
  } catch {
    const notFound = await readFile(path.join(PUBLIC_DIR, '404.html'));
    res.writeHead(404, headers('text/html; charset=utf-8'));
    res.end(notFound);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const handled = await api(req, res, url);
    if (handled !== false) return;
    await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error: 'Erro interno.' });
    else res.end();
  }
});

server.listen(PORT, () => console.log(`Lua Lu no ar em http://localhost:${PORT}`));
