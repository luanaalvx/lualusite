const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const header = $('[data-header]');
addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 20), { passive: true });

const menuButton = $('[data-menu-button]');
const nav = $('[data-nav]');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
$$('[data-nav] a').forEach(a => a.addEventListener('click', () => { nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded','false'); }));

const io = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));

async function loadProjects(){
  const host = $('[data-project-list]'); if(!host) return;
  try{
    const projects = await fetch('/api/projects').then(r => r.json());
    host.innerHTML = projects.slice(0,3).map(p => `<article class="project-card reveal" data-accent="${p.accent || 'pool'}"><div class="project-art" aria-hidden="true"></div><div class="project-copy"><p class="project-meta">${p.year} · ${p.services.join(' · ')}</p><h3>${p.name}</h3><p>${p.summary}</p><a class="text-link" href="/projetos/${p.slug}">Ver projeto ↗</a></div></article>`).join('');
    $$('.project-card.reveal',host).forEach(el=>io.observe(el));
  }catch{host.innerHTML='<p>Os projetos estão temporariamente indisponíveis.</p>'}
}
loadProjects();

const form = $('[data-contact-form]');
form?.addEventListener('submit', async e => {
  e.preventDefault(); const status = $('[data-form-status]'); const button = $('button[type="submit"]', form);
  const payload = Object.fromEntries(new FormData(form).entries());
  status.textContent='Enviando…'; button.disabled=true;
  try{
    const res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Não foi possível enviar.');
    status.textContent=data.message; form.reset();
  }catch(err){status.textContent=err.message}
  finally{button.disabled=false}
});

$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
