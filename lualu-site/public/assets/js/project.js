async function run(){
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const host=document.querySelector('[data-case]');
  const slug=location.pathname.split('/').filter(Boolean).pop();
  try{
    const res=await fetch(`/api/projects/${encodeURIComponent(slug)}`); if(!res.ok) throw new Error();
    const p=await res.json(); document.title=`${p.name} — Lua Lu`;
    const sections=[['Contexto',p.context],['Desafio',p.challenge],['Olhar',p.insight],['Processo',p.process],['Resultado',p.result]];
    host.innerHTML=`<section class="case-hero"><p class="eyebrow">Projeto · ${p.year}</p><h1>${p.name}</h1><div class="case-meta">${p.services.map(s=>`<span>${s}</span>`).join('')}</div><p class="case-summary">${p.summary}</p></section><section class="case-sections">${sections.map(([t,v])=>`<article><p class="eyebrow">${t}</p><h2>${t}</h2><p>${v}</p></article>`).join('')}</section><p><a class="button primary" href="/projetos">Ver outros projetos</a></p>`;
  }catch{host.innerHTML='<section class="case-hero"><p class="eyebrow">404</p><h1>Projeto não encontrado.</h1><p><a class="button primary" href="/projetos">Voltar aos projetos</a></p></section>'}
}run();
