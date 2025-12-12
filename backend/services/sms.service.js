const twilio = require('twilio');

// Configurar cliente Twilio
const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Enviar SMS para o cliente
async function enviarSMSCliente(pedido) {
  if (!client) {
    console.log('⚠️  Twilio não configurado (TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN ausentes)');
    return null;
  }

  if (!pedido.clienteTelefone) {
    console.log('⚠️  Cliente sem telefone cadastrado');
    return null;
  }

  // Formatar telefone para padrão internacional (+55 para Brasil)
  let telefone = pedido.clienteTelefone.replace(/\D/g, '');
  if (!telefone.startsWith('55')) {
    telefone = '55' + telefone;
  }
  if (!telefone.startsWith('+')) {
    telefone = '+' + telefone;
  }

  const mensagem = `🍔 Metanoia Hamburgueria

✅ Pedido #${pedido.id.substring(0, 8)} confirmado!

Olá ${pedido.clienteNome}, seu pedido está sendo preparado com carinho!

Total: R$ ${parseFloat(pedido.total).toFixed(2)}
Status: ${pedido.status}

${pedido.endereco ? `Entrega em: ${pedido.endereco.substring(0, 50)}...` : ''}

Qualquer dúvida, entre em contato!`;

  try {
    const message = await client.messages.create({
      body: mensagem,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefone,
    });
    
    console.log('✅ SMS enviado para cliente:', telefone);
    return message;
  } catch (error) {
    console.error('❌ Erro ao enviar SMS para cliente:', error.message);
    throw error;
  }
}

// Enviar SMS para o dono
async function enviarSMSDono(pedido) {
  if (!client) {
    console.log('⚠️  Twilio não configurado');
    return null;
  }

  const telefoneDono = process.env.OWNER_PHONE;
  if (!telefoneDono) {
    console.log('⚠️  Telefone do dono não configurado (OWNER_PHONE)');
    return null;
  }

  // Formatar telefone para padrão internacional
  let telefone = telefoneDono.replace(/\D/g, '');
  if (!telefone.startsWith('55')) {
    telefone = '55' + telefone;
  }
  if (!telefone.startsWith('+')) {
    telefone = '+' + telefone;
  }

  const mensagem = `🔔 NOVO PEDIDO #${pedido.id.substring(0, 8)}

Cliente: ${pedido.clienteNome}
Telefone: ${pedido.clienteTelefone}
Total: R$ ${parseFloat(pedido.total).toFixed(2)}

${pedido.observacao ? `Obs: ${pedido.observacao.substring(0, 100)}` : ''}

Acesse o painel admin para mais detalhes!`;

  try {
    const message = await client.messages.create({
      body: mensagem,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefone,
    });
    
    console.log('✅ SMS enviado para dono:', telefone);
    return message;
  } catch (error) {
    console.error('❌ Erro ao enviar SMS para dono:', error.message);
    throw error;
  }
}

module.exports = {
  enviarSMSCliente,
  enviarSMSDono,
};
