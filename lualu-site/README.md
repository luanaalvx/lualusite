# Lua Lu — site full stack

Site responsivo sem dependências externas de runtime além do Node.js.

## Rodar localmente

```bash
cp .env.example .env
npm start
```

Abra `http://localhost:3000`.

## Front-end
- HTML semântico e responsivo
- CSS baseado na identidade Maré Habitada
- Instrument Sans + Anybody via Google Fonts
- Logo e símbolo em SVG derivados dos arquivos finais enviados
- Home, listagem de projetos e páginas de case
- Formulário de contato com validação e estados de envio
- Respeito a `prefers-reduced-motion`

## Back-end
- Node.js HTTP nativo
- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `POST /api/contact`
- Validação, honeypot e rate limit simples
- Mensagens salvas em `data/contact-submissions.json`
- Opcional: `CONTACT_WEBHOOK_URL` para encaminhar contatos a um webhook externo

## Produção
O armazenamento em JSON funciona bem em servidor próprio/VPS. Em hospedagem serverless, troque o armazenamento do formulário por banco persistente (Postgres/Supabase etc.) ou configure `CONTACT_WEBHOOK_URL`.

## Antes de publicar
1. Substitua/complete os cases em `data/projects.json`.
2. Adicione fotografias reais dos projetos quando quiser.
3. Defina domínio e URLs absolutas em `sitemap.xml`.
4. Configure o webhook ou uma persistência de produção para o formulário.
5. Revise e-mail, Instagram e LinkedIn no footer quando os perfis da Lua Lu estiverem definidos.
