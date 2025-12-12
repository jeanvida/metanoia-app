const SibApiV3Sdk = require('@getbrevo/brevo');

// Configurar Brevo (Sendinblue)
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Enviar email para o cliente
async function enviarEmailCliente(pedido) {
  if (!pedido.clienteEmail) {
    console.log('⚠️  Cliente sem email cadastrado');
    return null;
  }

  const itensHtml = pedido.itens.map(item => {
    const nomeItem = item.item?.nome || item.nome;
    const preco = item.precoUnit || item.preco;
    
    return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${nomeItem}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${parseFloat(preco).toFixed(2)}</td>
    </tr>
  `}).join('');

  const emailData = {
    sender: { 
      name: process.env.RESTAURANT_NAME || 'Metanoia Burger',
      email: process.env.OWNER_EMAIL || 'metanoiaburger@gmail.com'
    },
    to: [{ email: pedido.clienteEmail }],
    subject: `✅ Pedido #${pedido.id.substring(0, 8)} confirmado!`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ff6b35;">🍔 Pedido Confirmado!</h1>
        
        <p>Olá <strong>${pedido.clienteNome}</strong>,</p>
        
        <p>Seu pedido foi recebido com sucesso e já está sendo preparado!</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📦 Pedido #${pedido.id.substring(0, 8)}</h3>
          <p><strong>Status:</strong> <span style="color: #ff6b35;">${pedido.status}</span></p>
          <p><strong>Data:</strong> ${new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
        </div>
        
        <h3>📋 Itens do Pedido:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #ff6b35; color: white;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qtd</th>
              <th style="padding: 10px; text-align: right;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin: 20px 0;">
          <p><strong>Subtotal:</strong> R$ ${(parseFloat(pedido.total) - parseFloat(pedido.frete)).toFixed(2)}</p>
          <p><strong>Frete:</strong> R$ ${parseFloat(pedido.frete).toFixed(2)}</p>
          <p style="font-size: 1.2em; color: #ff6b35;"><strong>Total:</strong> R$ ${parseFloat(pedido.total).toFixed(2)}</p>
        </div>
        
        ${pedido.endereco ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Endereço de Entrega:</h3>
            <p>${pedido.endereco}</p>
            <p>CEP: ${pedido.cep || 'Não informado'}</p>
          </div>
        ` : ''}
        
        ${pedido.observacao ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📝 Observações:</h3>
            <p>${pedido.observacao}</p>
          </div>
        ` : ''}
        
        <p>Qualquer dúvida, entre em contato conosco!</p>
        
        <p style="color: #999; font-size: 0.9em; margin-top: 30px;">
          Metanoia Hamburgueria - A melhor experiência em hambúrgueres artesanais 🍔
        </p>
      </div>
    `,
  };

  try {
    const result = await apiInstance.sendTransacEmail(emailData);
    console.log('✅ Email enviado para cliente:', pedido.clienteEmail);
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email para cliente:', error);
    throw error;
  }
}

// Enviar email para o dono/restaurante
async function enviarEmailDono(pedido) {
  const emailDono = process.env.OWNER_EMAIL;
  
  if (!emailDono) {
    console.log('⚠️  Email do dono não configurado (OWNER_EMAIL)');
    return null;
  }

  const itensHtml = pedido.itens.map(item => {
    const nomeItem = item.item?.nome || item.nome;
    const preco = item.precoUnit || item.preco;
    
    return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${nomeItem}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${parseFloat(preco).toFixed(2)}</td>
    </tr>
  `}).join('');

  const emailData = {
    sender: { 
      name: `Sistema ${process.env.RESTAURANT_NAME || 'Metanoia Burger'}`,
      email: process.env.OWNER_EMAIL || 'metanoiaburger@gmail.com'
    },
    to: [{ email: emailDono }],
    subject: `🔔 NOVO PEDIDO #${pedido.id.substring(0, 8)} - ${pedido.clienteNome}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ff6b35;">🔔 Novo Pedido Recebido!</h1>
        
        <div style="background: #ff6b35; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0;">Pedido #${pedido.id.substring(0, 8)}</h2>
          <p style="margin: 5px 0;">Status: ${pedido.status}</p>
          <p style="margin: 5px 0;">Data: ${new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">👤 Cliente:</h3>
          <p><strong>Nome:</strong> ${pedido.clienteNome}</p>
          <p><strong>Telefone:</strong> ${pedido.clienteTelefone}</p>
          ${pedido.clienteEmail ? `<p><strong>Email:</strong> ${pedido.clienteEmail}</p>` : ''}
          ${pedido.clienteCPF ? `<p><strong>CPF:</strong> ${pedido.clienteCPF}</p>` : ''}
        </div>
        
        ${pedido.endereco ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Endereço de Entrega:</h3>
            <p>${pedido.endereco}</p>
            <p>CEP: ${pedido.cep || 'Não informado'}</p>
          </div>
        ` : ''}
        
        <h3>📋 Itens do Pedido:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #ff6b35; color: white;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qtd</th>
              <th style="padding: 10px; text-align: right;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin: 20px 0;">
          <p><strong>Subtotal:</strong> R$ ${(parseFloat(pedido.total) - parseFloat(pedido.frete)).toFixed(2)}</p>
          <p><strong>Frete:</strong> R$ ${parseFloat(pedido.frete).toFixed(2)}</p>
          <p style="font-size: 1.3em; color: #ff6b35;"><strong>TOTAL:</strong> R$ ${parseFloat(pedido.total).toFixed(2)}</p>
        </div>
        
        ${pedido.observacao ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📝 Observações do Cliente:</h3>
            <p style="font-size: 1.1em;"><strong>${pedido.observacao}</strong></p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.ADMIN_URL || 'https://metanoia-app.vercel.app'}/admin" 
             style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Ver no Painel Admin
          </a>
        </div>
      </div>
    `,
  };

  try {
    const result = await apiInstance.sendTransacEmail(emailData);
    console.log('✅ Email enviado para dono:', emailDono);
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email para dono:', error);
    throw error;
  }
}

module.exports = {
  enviarEmailCliente,
  enviarEmailDono,
};
