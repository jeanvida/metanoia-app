# Sistema de Notificações - Metanoia Burger

Sistema completo de notificações para clientes e administradores quando um novo pedido é criado.

## 📧 Notificações Implementadas

### Para o Cliente
- **Email**: Confirmação do pedido com detalhes completos (itens, valores, endereço de entrega)
- **SMS**: Mensagem curta confirmando o pedido

### Para o Dono/Admin
- **Email**: Alerta de novo pedido com informações do cliente e link para o painel admin
- **SMS**: Alerta rápido de novo pedido
- **Notificação no App**: Badge e lista de pedidos recentes em tempo real

## 🔧 Configuração

### 1. Email (Gmail)

Para usar o Gmail como servidor de email:

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" → "Outro (nome personalizado)"
   - Digite "Metanoia App" e clique em "Gerar"
   - Copie a senha gerada (16 caracteres)

3. Configure as variáveis de ambiente no backend:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-de-16-caracteres
RESTAURANT_NAME=Metanoia Burger
OWNER_EMAIL=email-do-dono@gmail.com
ADMIN_URL=https://seu-site.com/admin
```

### 2. SMS (Twilio)

1. Crie uma conta no Twilio: https://www.twilio.com/try-twilio
2. No Dashboard, pegue suas credenciais:
   - Account SID
   - Auth Token
3. Compre um número de telefone (ou use o número de teste gratuito)
4. Configure as variáveis de ambiente no backend:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu-auth-token
TWILIO_PHONE_NUMBER=+5511999999999
OWNER_PHONE=+5511888888888
```

**Nota**: No modo de teste gratuito do Twilio, só é possível enviar SMS para números verificados.

### 3. Notificações do Navegador

As notificações no painel admin usam a API de Notificações do navegador. 

O usuário será solicitado a permitir notificações na primeira vez que acessar o painel.

## 📁 Arquivos Criados

### Backend
- `backend/services/email.service.js` - Serviço de envio de emails
- `backend/services/sms.service.js` - Serviço de envio de SMS
- `backend/index.js` - Integração com os serviços (linhas 1-6, 436-445)
- Nova rota: `GET /api/pedidos/recentes` - Busca pedidos recentes para notificações

### Frontend
- `src/components/NotificacoesPedidos.jsx` - Componente de notificações no admin
- `src/components/NotificacoesPedidos.css` - Estilos do componente
- `src/pages/Admin.jsx` - Atualizado para incluir o componente de notificações

## 🚀 Como Funciona

### Fluxo de Notificações

1. **Cliente finaliza pedido** no frontend
2. **Backend cria o pedido** no banco de dados
3. **Notificações são enviadas** (assíncrono, não bloqueia a resposta):
   ```javascript
   Promise.all([
     enviarEmailCliente(pedido).catch(err => console.error("Email cliente:", err)),
     enviarEmailDono(pedido).catch(err => console.error("Email dono:", err)),
     enviarSMSCliente(pedido).catch(err => console.error("SMS cliente:", err)),
     enviarSMSDono(pedido).catch(err => console.error("SMS dono:", err))
   ]);
   ```
4. **Frontend do admin** busca pedidos recentes a cada 30 segundos
5. **Notificação do navegador** é exibida quando há novos pedidos

### Notificação no Admin

O componente `NotificacoesPedidos` no painel admin:
- Busca pedidos recentes a cada 30 segundos
- Mostra badge com número de pedidos não lidos
- Exibe lista dropdown com detalhes dos pedidos
- Mostra notificação do navegador quando há novos pedidos
- (Opcional) Toca som de notificação

## 🎨 Interface

### Badge de Notificações
```
🔔 [3]  ← Badge vermelho com número de pedidos
```

### Dropdown de Notificações
```
┌─────────────────────────────────┐
│ Pedidos Recentes  [Marcar lido]│
├─────────────────────────────────┤
│ João Silva          [PENDENTE]  │
│ R$ 45,90           15:23        │
├─────────────────────────────────┤
│ Maria Santos        [PREPARANDO]│
│ R$ 32,50           15:18        │
└─────────────────────────────────┘
```

## 🧪 Testando

### Teste de Email
```javascript
// No console do Node.js ou em um arquivo de teste
const { enviarEmailCliente } = require('./backend/services/email.service');

enviarEmailCliente({
  clienteNome: "João Silva",
  clienteEmail: "joao@email.com",
  itens: [{
    quantidade: 2,
    nome: "X-Burger",
    preco: 25.00
  }],
  valorTotal: 50.00,
  endereco: "Rua Teste, 123",
  cep: "12345-678",
  observacao: "Sem cebola"
});
```

### Teste de SMS
```javascript
const { enviarSMSCliente } = require('./backend/services/sms.service');

enviarSMSCliente({
  clienteNome: "João Silva",
  clienteTelefone: "11999999999",
  id: "123"
});
```

## ⚠️ Observações Importantes

1. **Gmail**: Configure corretamente a senha de app. Senhas normais não funcionam.
2. **Twilio**: Conta gratuita tem limitações. Considere upgrade para produção.
3. **Números de Telefone**: Use formato internacional (+55 para Brasil).
4. **Notificações do Navegador**: Funcionam apenas em HTTPS (produção) ou localhost.
5. **Performance**: Notificações são enviadas de forma assíncrona para não atrasar a resposta ao cliente.

## 📝 Próximos Passos

- [ ] Configurar credenciais reais de email e SMS
- [ ] Testar envio de email e SMS
- [ ] Adicionar templates personalizados de email
- [ ] Implementar WhatsApp como alternativa ao SMS (via Twilio)
- [ ] Adicionar histórico de notificações no banco de dados
- [ ] Implementar WebSocket para notificações em tempo real (substituir polling)

## 🆘 Problemas Comuns

### Email não está sendo enviado
- Verifique se a senha de app está correta
- Confirme que EMAIL_USER e EMAIL_PASS estão nas variáveis de ambiente
- Veja os logs do servidor para mensagens de erro

### SMS não está sendo enviado
- Verifique as credenciais do Twilio
- Confirme que o número está no formato internacional (+55...)
- Na conta gratuita, verifique se o número de destino está verificado

### Notificações não aparecem no admin
- Verifique se o usuário permitiu notificações no navegador
- Confirme que a rota `/api/pedidos/recentes` está funcionando
- Veja o console do navegador para erros
