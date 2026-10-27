async function run() {
  document.querySelectorAll('[data-year]').forEach(
    el => el.textContent = new Date().getFullYear()
  );

  const footer = document.querySelector('.footer');

  if (footer && !footer.querySelector('.footer-socials')) {
    const socials = document.createElement('nav');
    socials.className = 'footer-socials';
    socials.setAttribute('aria-label', 'Redes sociais');

    socials.innerHTML = `
      <a href="https://www.instagram.com/lualu.comunicacao/"
         target="_blank" rel="noopener noreferrer"
         aria-label="Instagram Lua Lu" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="18" cy="6" r=".8" class="icon-fill"/>
        </svg>
      </a>
      <a href="https://www.linkedin.com/company/lualu-comunicacao/"
         target="_blank" rel="noopener noreferrer"
         aria-label="LinkedIn Lua Lu" title="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path class="icon-fill"
            d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5H7v11H3.4zM9.2 9.5h3.5V11h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v5.9h-3.7v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.2z"/>
        </svg>
      </a>`;

    footer.insertBefore(socials, footer.querySelector(':scope > p'));
  }

  const host = document.querySelector('[data-all-projects]');
  if (!host) return;

  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Erro ao carregar projetos');

    const projects = await res.json();

    host.innerHTML = projects.map(p => `
      <a class="all-project-card"
         href="/projetos/${encodeURIComponent(p.slug)}"
         data-accent="${p.accent || 'pool'}">
        <small>${p.year} · ${p.services.join(' · ')}</small>
        <h2>${p.name}</h2>
        <p>${p.summary}</p>
        <span class="text-link">Abrir case ↗</span>
      </a>
    `).join('');

  } catch {
    host.innerHTML = '<p>Não foi possível carregar os projetos.</p>';
  }
}

run();