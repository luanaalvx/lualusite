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
      <!-- Instagram -->
      <a href="https://www.instagram.com/lualu.comunicacao/"
         target="_blank" rel="noopener noreferrer"
         aria-label="Instagram Lua Lu" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="18" cy="6" r=".8" class="icon-fill"/>
        </svg>
      </a>

      <!-- LinkedIn -->
      <a href="https://www.linkedin.com/company/lualu-comunicacao/"
         target="_blank" rel="noopener noreferrer"
         aria-label="LinkedIn Lua Lu" title="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path class="icon-fill"
            d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5H7v11H3.4zM9.2 9.5h3.5V11h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v5.3H19.2z"/>
        </svg>
      </a>

      <!-- WhatsApp -->
      <a href="https://wa.me/5511972980775?text=Ol%C3%A1!%20Conheci%20a%20LuaLu%20Comunica%C3%A7%C3%A3o%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os."
         target="_blank" rel="noopener noreferrer"
         aria-label="WhatsApp Lua Lu" title="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 21l1.5-4.8a8.5 8.5 0 1 1 16-4.4Z"/>
          <path d="M8.5 7.5c-.5-.5-1.5 0-1.5 1.5 0 3.5 4.5 8 8 8 1.5 0 2-1 1.5-1.5l-2.5-2-1.5 1a9 9 0 0 1-3-3l1-1.5Z"/>
        </svg>
      </a>
    `;
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