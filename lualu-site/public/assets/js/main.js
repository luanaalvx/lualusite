const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const header = $('[data-header]');
addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 20), { passive: true });

const menuButton = $('[data-menu-button]');
const nav = $('[data-nav]');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
$$('[data-nav] a').forEach(a => a.addEventListener('click', () => { nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); }));

const io = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));


/* Carregamento dos projetos */

// Protege os textos inseridos no HTML
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadProjects() {
  const host = $('[data-project-list]');
  if (!host) return;

  try {
    const res = await fetch('/api/projects');

    if (!res.ok) {
      throw new Error('Não foi possível carregar os projetos.');
    }

    const projects = await res.json();

    host.innerHTML = projects.map(p => {
      const accent = escapeHtml(p.accent || 'pool');
      const name = escapeHtml(p.name);
      const category = escapeHtml(
        p.category || p.services[0] || 'Projeto'
      );

      const meta = p.projectNumber
        ? `PROJETO ${escapeHtml(p.projectNumber)} · ${category}`
        : `${escapeHtml(p.year)} · ${p.services.map(escapeHtml).join(' · ')}`;

      // Sem imagem de capa, mantém o grafismo original
      const art = p.coverImage
        ? `<div class="project-art project-art--photo">
             <img
               src="${escapeHtml(p.coverImage)}"
               alt="${escapeHtml(p.coverAlt || name)}"
               loading="lazy">
           </div>`
        : `<div class="project-art" aria-hidden="true"></div>`;

      return `
        <article class="project-card reveal" data-accent="${accent}">
          ${art}

          <div class="project-copy">
            <p class="project-meta">${meta}</p>
            <h3>${name}</h3>
            <p>${escapeHtml(p.summary)}</p>

            <a
              class="text-link"
              href="/projetos/${encodeURIComponent(p.slug)}"
              aria-label="Ver projeto ${name}">
              Ver projeto ↗
            </a>
          </div>
        </article>`;
    }).join('');

    $$('.project-card.reveal', host).forEach(el => io.observe(el));

  } catch {
    host.innerHTML =
      '<p>Os projetos estão temporariamente indisponíveis.</p>';
  }
}


async function loadProjects() {
  const host = $('[data-project-list]');
  if (!host) return;
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Não foi possível carregar os projetos.');
    const projects = await res.json();
    host.innerHTML = projects.map(p => {
      const accent = escapeHtml(p.accent || 'pool');
      const name = escapeHtml(p.name);
      const category = escapeHtml(p.category || p.services[0] || 'Projeto');
      const meta = p.projectNumber
        ? `PROJETO ${escapeHtml(p.projectNumber)} · ${category}`
        : `${escapeHtml(p.year)} · ${p.services.map(escapeHtml).join(' · ')}`;
      // Sem foto real, mantém-se o grafismo decorativo genérico do site.
      const art = p.coverImage
        ? `<div class="project-art project-art--photo"><img src="${escapeHtml(p.coverImage)}" alt="${escapeHtml(p.coverAlt || name)}" loading="lazy"></div>`
        : '<div class="project-art" aria-hidden="true"></div>';
      return `
        <article class="project-card reveal" data-accent="${accent}">
          ${art}
          <div class="project-copy">
            <p class="project-meta">${meta}</p>
            <h3>${name}</h3>
            <p>${escapeHtml(p.summary)}</p>
            <a class="text-link" href="/projetos/${encodeURIComponent(p.slug)}" aria-label="Ver projeto ${name}">Ver projeto ↗</a>
          </div>
        </article>`;
    }).join('');
    $$('.project-card.reveal', host).forEach(el => io.observe(el));
  } catch {
    host.innerHTML = '<p>Os projetos estão temporariamente indisponíveis.</p>';
  }
}

loadProjects();

const form = $('[data-contact-form]');
form?.addEventListener('submit', async e => {
  e.preventDefault(); const status = $('[data-form-status]'); const button = $('button[type="submit"]', form);
  const payload = Object.fromEntries(new FormData(form).entries());
  status.textContent = 'Enviando…'; button.disabled = true;
  try {
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Não foi possível enviar.');
    status.textContent = data.message; form.reset();
  } catch (err) { status.textContent = err.message }
  finally { button.disabled = false }
});

$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

