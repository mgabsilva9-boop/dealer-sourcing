/**
 * Middleware centralizador de erros
 */

import { APIResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Erro de autenticação
  if (err.message === 'Token inválido' || err.message === 'Token expirado') {
    return res.status(401).json(APIResponse.unauthorized(err.message).toJSON());
  }

  // Erro de validação
  if (err.message === 'Dados inválidos') {
    return res.status(400).json(APIResponse.badRequest(err.message).toJSON());
  }

  // Erro de não encontrado
  if (err.status === 404) {
    return res.status(404).json(APIResponse.notFound(err.message).toJSON());
  }

  // Erro genérico
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json(APIResponse.serverError(message).toJSON());
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
