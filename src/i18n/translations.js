export const translations = {
  pt: {
    // Home
    bemVindo: "Bem-vindo ao Metanoia Burger!",
    subtitulo: "Esqueça tudo o que você sabe sobre hambúrguer! Clique no Cardápio para começar.",
    
    // Navegação principal
    inicio: "Início",
    
    // Categorias
    Hamburgueres: "Hambúrgueres",
    Combos: "Combos",
    Acompanhamentos: "Acompanhamentos",
    Bebidas: "Bebidas",
    
    // Navegação
    cardapio: "Cardápio",
    carrinho: "Carrinho",
    checkout: "Checkout",
    pagamento: "Pagamento",
    
    // Carrinho
    carrinhoVazio: "O carrinho está vazio.",
    total: "Total",
    irParaCheckout: "Ir para Checkout",
    quantidade: "Quantidade",
    
    // Checkout
    endereco: "Endereço",
    cep: "CEP",
    rua: "Rua",
    numero: "Número",
    apCasa: "Ap / Casa",
    bairro: "Bairro",
    cidade: "Cidade",
    estado: "Estado",
    frete: "Frete",
    
    dadosPessoais: "Dados Pessoais",
    nome: "Nome",
    telefone: "Telefone",
    email: "Email",
    cpf: "CPF (somente números)",
    
    resumoPedido: "Resumo do Pedido",
    irParaPagamento: "Ir para Pagamento",
    
    metodoPagamento: "Método de Pagamento",
    confirmarPedido: "Confirmar Pedido",
    
    // Pagamento
    cartaoCredito: "Cartão de Crédito",
    numeroCartao: "Número do Cartão",
    nomeCartao: "Nome no Cartão",
    validade: "Validade (MM/AA)",
    cvv: "CVV",
    pagarComCartao: "Pagar com Cartão",
    pagarComPix: "Pagar com PIX",
    confirmarPagamento: "Confirmar Pagamento",
    cancelar: "Cancelar",
    pix: "PIX",
    aguarde: "Aguarde...",
    
    // Botões
    adicionar: "Adicionar",
    remover: "Remover",
    voltar: "Voltar",
    fechar: "Fechar",
  },
  
  es: {
    // Home
    bemVindo: "¡Bienvenido a Metanoia Burger!",
    subtitulo: "¡Olvida todo lo que sabes sobre hamburguesas! Haz clic en el Menú para empezar.",
    
    // Navegação principal
    inicio: "Inicio",
    
    // Categorias
    Hamburgueres: "Hamburguesas",
    Combos: "Combos",
    Acompanhamentos: "Acompañamientos",
    Bebidas: "Bebidas",
    
    // Navegação
    cardapio: "Menú",
    carrinho: "Carrito",
    checkout: "Checkout",
    pagamento: "Pago",
    
    // Carrinho
    carrinhoVazio: "El carrito está vacío.",
    total: "Total",
    irParaCheckout: "Ir al Checkout",
    quantidade: "Cantidad",
    
    // Checkout
    endereco: "Dirección",
    cep: "Código Postal",
    rua: "Calle",
    numero: "Número",
    apCasa: "Apto / Casa",
    bairro: "Barrio",
    cidade: "Ciudad",
    estado: "Estado",
    frete: "Envío",
    
    dadosPessoais: "Datos Personales",
    nome: "Nombre",
    telefone: "Teléfono",
    email: "Email",
    cpf: "CPF/DNI (solo números)",
    
    resumoPedido: "Resumen del Pedido",
    irParaPagamento: "Ir al Pago",
    
    metodoPagamento: "Método de Pago",
    confirmarPedido: "Confirmar Pedido",
    
    // Pagamento
    cartaoCredito: "Tarjeta de Crédito",
    numeroCartao: "Número de Tarjeta",
    nomeCartao: "Nombre en la Tarjeta",
    validade: "Validez (MM/AA)",
    cvv: "CVV",
    pagarComCartao: "Pagar con Tarjeta",
    pagarComPix: "Pagar con PIX",
    confirmarPagamento: "Confirmar Pago",
    cancelar: "Cancelar",
    pix: "PIX",
    aguarde: "Espere...",
    
    // Botões
    adicionar: "Añadir",
    remover: "Eliminar",
    voltar: "Volver",
    fechar: "Cerrar",
  },
  
  en: {
    // Home
    bemVindo: "Welcome to Metanoia Burger!",
    subtitulo: "Forget everything you know about burgers! Click on the Menu to get started.",
    
    // Navegação principal
    inicio: "Home",
    
    // Categorias
    Hamburgueres: "Burgers",
    Combos: "Combos",
    Acompanhamentos: "Sides",
    Bebidas: "Drinks",
    
    // Navegação
    cardapio: "Menu",
    carrinho: "Cart",
    checkout: "Checkout",
    pagamento: "Payment",
    
    // Carrinho
    carrinhoVazio: "Your cart is empty.",
    total: "Total",
    irParaCheckout: "Go to Checkout",
    quantidade: "Quantity",
    
    // Checkout
    endereco: "Address",
    cep: "ZIP Code",
    rua: "Street",
    numero: "Number",
    apCasa: "Apt / House",
    bairro: "Neighborhood",
    cidade: "City",
    estado: "State",
    frete: "Shipping",
    
    dadosPessoais: "Personal Information",
    nome: "Name",
    telefone: "Phone",
    email: "Email",
    cpf: "Tax ID (numbers only)",
    
    resumoPedido: "Order Summary",
    irParaPagamento: "Go to Payment",
    
    metodoPagamento: "Payment Method",
    confirmarPedido: "Confirm Order",
    
    // Pagamento
    cartaoCredito: "Credit Card",
    numeroCartao: "Card Number",
    nomeCartao: "Name on Card",
    validade: "Expiry (MM/YY)",
    cvv: "CVV",
    pagarComCartao: "Pay with Card",
    pagarComPix: "Pay with PIX",
    confirmarPagamento: "Confirm Payment",
    cancelar: "Cancel",
    pix: "PIX",
    aguarde: "Please wait...",
    
    // Botões
    adicionar: "Add",
    remover: "Remove",
    voltar: "Back",
    fechar: "Close",
  }
};

export const getTranslation = (lang, key) => {
  return translations[lang]?.[key] || translations.pt[key] || key;
};
