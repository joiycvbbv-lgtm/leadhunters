/** Tipos de negócio mais procurados, por grupo. Dá para digitar qualquer outro no campo. */
export type NicheGroup = { id: string; label: string; niches: string[] };

export const NICHE_GROUPS: NicheGroup[] = [
  {
    id: "comida",
    label: "Comida e bebida",
    niches: [
      "restaurante", "lanchonete", "pizzaria", "hamburgueria", "padaria", "confeitaria", "doceria", "açaí",
      "sorveteria", "cafeteria", "bar", "churrascaria", "marmitaria", "pastelaria", "espetinho", "sushi",
      "comida japonesa", "comida caseira", "adega", "distribuidora de bebidas", "casa de carnes", "hortifruti",
    ],
  },
  {
    id: "beleza",
    label: "Beleza e bem-estar",
    niches: [
      "salão de beleza", "barbearia", "manicure", "clínica de estética", "studio de sobrancelhas",
      "depilação", "spa", "massagem", "tatuagem", "lash designer", "cabeleireiro", "estúdio de unhas",
      "maquiagem", "bronzeamento",
    ],
  },
  {
    id: "saude",
    label: "Saúde",
    niches: [
      "dentista", "clínica odontológica", "psicólogo", "fisioterapia", "nutricionista", "clínica médica",
      "veterinário", "pet shop", "farmácia", "laboratório", "ótica", "fonoaudiologia", "quiropraxia",
      "clínica de vacinas", "ortodontia", "dermatologista",
    ],
  },
  {
    id: "auto",
    label: "Automotivo",
    niches: [
      "oficina mecânica", "lava jato", "auto elétrica", "borracharia", "funilaria e pintura", "autopeças",
      "concessionária", "loja de pneus", "som automotivo", "martelinho de ouro", "estacionamento",
      "vidraçaria automotiva", "auto escola", "moto peças", "oficina de motos",
    ],
  },
  {
    id: "casa",
    label: "Casa e construção",
    niches: [
      "material de construção", "marcenaria", "móveis planejados", "vidraçaria", "serralheria", "eletricista",
      "encanador", "pintor", "dedetização", "chaveiro", "ar-condicionado", "marmoraria", "paisagismo",
      "limpeza de estofados", "empresa de mudanças", "reforma e construção", "gesso e drywall", "piscinas",
      "energia solar", "colchões",
    ],
  },
  {
    id: "comercio",
    label: "Lojas",
    niches: [
      "loja de roupas", "loja de calçados", "boutique", "joalheria", "papelaria", "floricultura",
      "mercadinho", "loja de celular", "loja de informática", "loja de brinquedos", "loja de presentes",
      "loja de bebê", "loja de móveis", "loja de eletrônicos", "loja de utilidades", "loja de cosméticos",
      "moda fitness", "loja de artesanato",
    ],
  },
  {
    id: "servicos",
    label: "Serviços",
    niches: [
      "contabilidade", "advogado", "imobiliária", "despachante", "gráfica", "fotógrafo", "agência de viagens",
      "lavanderia", "costureira", "assistência técnica", "empresa de segurança", "transportadora",
      "serviços de TI", "marketing", "corretor de seguros", "cartório", "locadora de veículos",
      "organização de eventos", "decoração de festas", "buffet",
    ],
  },
  {
    id: "educacao",
    label: "Educação e lazer",
    niches: [
      "academia", "crossfit", "pilates", "yoga", "estúdio de dança", "escola de natação", "escola de idiomas",
      "escola de música", "reforço escolar", "escola infantil", "salão de festas", "buffet infantil",
      "espaço de eventos", "clube", "artes marciais", "curso profissionalizante", "quadra esportiva",
    ],
  },
];

export const ALL_NICHES = Array.from(new Set(NICHE_GROUPS.flatMap((group) => group.niches))).sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);
