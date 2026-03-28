/**
 * Validadores reutilizáveis
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateVehicle = (vehicle) => {
  const required = ['make', 'model', 'year', 'purchasePrice'];
  return required.every(field => vehicle[field] !== undefined && vehicle[field] !== null && vehicle[field] !== '');
};

export const validateCustomer = (customer) => {
  const required = ['name', 'phone'];
  return required.every(field => customer[field] !== undefined && customer[field] !== null && customer[field] !== '');
};

export const validateExpense = (expense) => {
  const required = ['category', 'amount', 'date'];
  return required.every(field => expense[field] !== undefined && expense[field] !== null && expense[field] !== '');
};

export const validateSourcingFilters = (filters) => {
  // Todos opcionais, mas validar tipos se presentes
  if (filters.priceMin && isNaN(Number(filters.priceMin))) return false;
  if (filters.priceMax && isNaN(Number(filters.priceMax))) return false;
  if (filters.kmMax && isNaN(Number(filters.kmMax))) return false;
  if (filters.discountMin && isNaN(Number(filters.discountMin))) return false;
  return true;
};
