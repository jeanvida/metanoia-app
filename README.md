## Variáveis de Ambiente (Backend)

Crie um arquivo `backend/.env` com as seguintes variáveis:

### Obrigatórias

- `PORT` — Porta do servidor backend (ex: 3001)
- `DATABASE_URL` — URL de conexão do banco Supabase/Postgres
- `PAGBANK_TOKEN` — Token da API PagBank
- `PAGBANK_API_URL` — URL da API PagBank
- `PRISMA_CLIENT_ENGINE_TYPE` — Tipo de engine do Prisma (ex: binary)
- `RECAPTCHA_SECRET_KEY` — Chave secreta do Google reCAPTCHA
- `BREVO_API_KEY` — Chave da API Brevo (Sendinblue)
- `RESTAURANT_NAME` — Nome do restaurante (para emails)
- `OWNER_EMAIL` — Email do dono (para notificações)
- `ADMIN_TOKEN` — Token de autenticação para rotas admin

### Opcionais (para notificações por SMS)
- `TWILIO_ACCOUNT_SID` — SID da conta Twilio
- `TWILIO_AUTH_TOKEN` — Token da conta Twilio
- `TWILIO_PHONE_NUMBER` — Número Twilio
- `OWNER_PHONE` — Telefone do dono

**Importante:** Nunca compartilhe seu .env publicamente. Sempre configure essas variáveis no painel do Render (backend) e Vercel (frontend) em produção.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
