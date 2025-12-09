# 🔐 Atualizar reCAPTCHA v2 - Guia Rápido

## 1️⃣ Vercel (Frontend)

1. Ir para **https://vercel.com/dashboard**
2. Selecionar projeto **metanoia-app**
3. Clicar em **Settings** → **Environment Variables**
4. Procurar por `VITE_RECAPTCHA_SITE_KEY` e:
   - Se existir, **editar** e substituir o valor
   - Se não existir, **adicionar nova**:
     - **Name:** `VITE_RECAPTCHA_SITE_KEY`
     - **Value:** `6LdSkSUsAAAAAEIa-AOORUmjlBOE_cDXht6nxNAM`
     - **Environments:** Production, Preview, Development
5. Clicar em **Save**
6. Ir para **Deployments** e clicar em **Redeploy** na versão mais recente

---

## 2️⃣ Render (Backend)

1. Ir para **https://dashboard.render.com**
2. Selecionar serviço **metanoia-app**
3. Clicar em **Environment**
4. Procurar por `RECAPTCHA_SECRET_KEY` e:
   - Se existir, **editar** e substituir o valor
   - Se não existir, **adicionar nova**:
     - **Key:** `RECAPTCHA_SECRET_KEY`
     - **Value:** `6LdSkSUsAAAAAKjdFD7IxPULkPIKmxcMlzYxTYAT`
5. Clicar em **Save Changes**
6. O serviço vai fazer redeploy automaticamente

---

## 3️⃣ Testar Localmente (Opcional)

Se quiser testar com as chaves v2 localmente:

1. Criar/editar arquivo `.env.local` na raiz:
   ```
   VITE_API_URL=http://localhost:3001/api
   VITE_RECAPTCHA_SITE_KEY=6LdSkSUsAAAAAEIa-AOORUmjlBOE_cDXht6nxNAM
   ```

2. Backend - adicionar ao `.env`:
   ```
   RECAPTCHA_SECRET_KEY=6LdSkSUsAAAAAKjdFD7IxPULkPIKmxcMlzYxTYAT
   ```

3. Rodar `npm run dev` e testar em `http://localhost:5173`

---

## ✅ Verificação

Após atualizar, quando ir para a aba **Pagamento**:
- ✅ Deve aparecer um checkbox grande escrito **"Não sou um robô"**
- ✅ Ao marcar, o Google valida automaticamente
- ✅ Depois consegue clicar em "Pagar com Cartão" ou "Pagar com PIX"

**Pronto! reCAPTCHA v2 está operacional!** 🚀
