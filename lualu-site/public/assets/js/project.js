// Cada case recebe seus dados do data/projects.json através do servidor.
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function run() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const footer = document.querySelector('.footer');
  if (footer) {
    const socials = document.createElement('nav');
    socials.className = 'footer-socials';
    socials.setAttribute('aria-label', 'Redes sociais');
    socials.innerHTML = '<a href="https://www.instagram.com/lualu.comunicacao/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Lua Lu" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".8" class="icon-fill"/></svg></a><a href="https://www.linkedin.com/company/lualu-comunicacao/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Lua Lu" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="icon-fill" d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5H7v11H3.4zM9.2 9.5h3.5V11h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v5.9h-3.7v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.2z"/></svg></a>';
    footer.insertBefore(socials, footer.querySelector(':scope > p'));
  }
  const host = document.querySelector('[data-case]');
  const slug = location.pathname.split('/').filter(Boolean).pop();
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Projeto não encontrado');
    const p = await res.json();
    document.title = `${p.name} — Lua Lu`;
    const label = p.projectNumber
      ? `PROJETO ${escapeHtml(p.projectNumber)} · ${escapeHtml(p.category || 'Projeto').toUpperCase()}`
      : `Projeto · ${escapeHtml(p.year)}`;
    const isEditorial = Array.isArray(p.intro) && p.intro.length > 0;
    const hero = `<section class="case-hero" data-accent="${escapeHtml(p.accent || 'pool')}">
      ${isEditorial ? '<p class="eyebrow case-portfolio">Portfólio</p>' : ''}
      <p class="eyebrow">${label}</p>
      <h1>${escapeHtml(p.name)}</h1>
      <div class="case-meta">${p.services.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
      ${isEditorial ? '' : `<p class="case-summary">${escapeHtml(p.summary)}</p>`}
    </section>`;
    const sections = [['Contexto', p.context], ['Desafio', p.challenge], ['Olhar', p.insight], ['Processo', p.process], ['Resultado', p.result]];
    const body = isEditorial
      ? `<section class="case-intro" aria-label="Sobre o projeto">${p.intro.map(par => `<p>${escapeHtml(par)}</p>`).join('')}</section>
         ${p.deliverable ? `<section class="case-deliverable"><p class="eyebrow">Entregável</p><p>${escapeHtml(p.deliverable)}</p></section>` : ''}`
      : `<section class="case-sections">${sections.filter(([, value]) => value).map(([title, value]) => `<article><p class="eyebrow">${title}</p><h2>${title}</h2><p>${escapeHtml(value)}</p></article>`).join('')}</section>`;
    // Imagens só aparecem quando você cadastrar arquivos reais no JSON.
    const images = [
      ...(p.coverImage ? [{ src: p.coverImage, alt: p.coverAlt || p.name, caption: p.coverCaption || '' }] : []),
      ...(Array.isArray(p.gallery) ? p.gallery : [])
    ];
    const gallery = images.length ? `<section class="case-gallery" aria-label="Imagens do projeto">${images.map(img =>
      `<figure><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || p.name)}" loading="lazy">${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}</figure>`
    ).join('')}</section>` : '';
    host.innerHTML = `${hero}${body}${gallery}<p class="case-back"><a class="button primary" href="/projetos">Ver outros projetos</a></p>`;
  } catch {
    host.innerHTML = '<section class="case-hero"><p class="eyebrow">404</p><h1>Projeto não encontrado.</h1><p><a class="button primary" href="/projetos">Voltar aos projetos</a></p></section>';
  }
}
run();