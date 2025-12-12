require('dotenv').config();
const { enviarEmailCliente, enviarEmailDono } = require('./services/email.service');

// Dados de teste
const pedidoTeste = {
  id: 'TESTE-123',
  clienteNome: 'João Teste',
  clienteEmail: process.env.OWNER_EMAIL, // Vai enviar para você mesmo
  clienteTelefone: '11999999999',
  itens: [
    {
      quantidade: 2,
      nome: 'X-Burger',
      precoUnit: 25.00
    },
    {
      quantidade: 1,
      nome: 'Coca-Cola',
      precoUnit: 5.00
    }
  ],
  total: 55.00,
  frete: 8.00,
  endereco: 'Rua Teste, 123 - Bairro Exemplo',
  cep: '12345-678',
  observacao: 'Sem cebola, por favor'
};

console.log('🧪 Testando envio de email...\n');
console.log('📧 Enviando para:', pedidoTeste.clienteEmail);
console.log('📝 Usando EMAIL_USER:', process.env.EMAIL_USER);
console.log('---\n');

// Teste de email do cliente
enviarEmailCliente(pedidoTeste)
  .then(() => {
    console.log('✅ Email do cliente enviado com sucesso!');
    
    // Teste de email do dono
    return enviarEmailDono(pedidoTeste);
  })
  .then(() => {
    console.log('✅ Email do dono enviado com sucesso!');
    console.log('\n🎉 Todos os emails foram enviados! Verifique sua caixa de entrada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('\n📋 Detalhes do erro:', error);
    process.exit(1);
  });
