// backend/validators/pedidoValidator.js
const { z } = require('zod');

const pedidoSchema = z.object({
  clienteNome: z.string().min(2),
  clienteEmail: z.string().email().optional(),
  clienteTelefone: z.string().min(8),
  itens: z.array(z.object({
    nome: z.string(),
    quantidade: z.number().int().min(1),
    preco: z.number().min(0),
  })),
  total: z.number().min(0),
  frete: z.number().min(0).optional(),
  endereco: z.string().optional(),
  observacao: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

function validarPedido(req, res, next) {
  try {
    pedidoSchema.parse(req.body);
    next();
  } catch (e) {
    return res.status(400).json({ error: 'Dados do pedido inválidos', detalhes: e.errors });
  }
}

module.exports = { validarPedido };
