async function run(){
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const host=document.querySelector('[data-all-projects]');
  try{
    const projects=await fetch('/api/projects').then(r=>r.json());
    host.innerHTML=projects.map(p=>`<a class="all-project-card" href="/projetos/${p.slug}"><small>${p.year} · ${p.services.join(' · ')}</small><h2>${p.name}</h2><p>${p.summary}</p><span class="text-link">Abrir case ↗</span></a>`).join('');
  }catch{host.innerHTML='<p>Não foi possível carregar os projetos.</p>'}
}run();
