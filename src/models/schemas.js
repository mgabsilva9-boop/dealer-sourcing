/**
 * Esquemas de dados da aplicação
 * Referência para tipagem e validação
 */

export const VehicleSchema = {
  id: 'number',
  make: 'string', // marca: Ford, BMW, Ram, etc
  model: 'string', // modelo: Ka, M3, 1500 Laramie
  year: 'number',
  purchasePrice: 'number', // preço de compra
  salePrice: 'number', // preço de venda (0 se não vendido)
  fipePrice: 'number', // valor FIPE
  mileage: 'number', // quilometragem
  status: 'string', // available, sold, maintenance, etc
  daysInStock: 'number',
  location: 'string', // loja
  costs: 'object', // { "Compra": 50000, "Funilaria": 600, ... }
  motor: 'string',
  potencia: 'string',
  features: 'string',
  soldDate: 'string', // ISO date
  soldTo: 'string', // nome cliente
  docs: 'array', // documentação
};

export const CustomerSchema = {
  id: 'number',
  name: 'string',
  phone: 'string',
  email: 'string',
  cpf: 'string',
  vehicleBought: 'string',
  purchaseDate: 'string', // ISO date
  purchaseValue: 'number',
  notes: 'string',
  style: 'string', // estilo de veículo
  region: 'string',
  collector: 'boolean',
  birthday: 'string', // ISO date
  profession: 'string',
  referral: 'string', // como conheceu
  contactPref: 'string', // preferência de contato
};

export const ExpenseSchema = {
  id: 'number',
  category: 'string', // Operacional, IPVA, etc
  description: 'string',
  amount: 'number',
  status: 'string', // paid, pending, urgent, overdue
  date: 'string', // ISO date
  notes: 'string',
};

export const SourcingSchema = {
  id: 'number',
  platform: 'string', // WebMotors, OLX, etc
  make: 'string',
  model: 'string',
  year: 'number',
  price: 'number', // preço anúncio
  fipe: 'number', // FIPE
  discount: 'number', // percentual desconto vs FIPE (negativo = abaixo FIPE)
  km: 'number',
  location: 'string',
  score: 'number', // 1-100, qualidade do negócio
  time: 'string', // "2h atras", "45min atras"
  phone: 'string', // contato anunciante
  url: 'string', // link anúncio
  kmRating: 'string', // Muito baixa, Baixa, Media, Alta
  owners: 'number', // quantidade donos anteriores
  accidents: 'number', // quantos acidentes registrados
  serviceHistory: 'string', // Completo, Parcial, Sem registros
  bodyCondition: 'string', // Excelente, Bom, Regular
};

export const AuthResponseSchema = {
  token: 'string', // JWT
  user: {
    id: 'number',
    email: 'string',
    name: 'string',
  },
};
