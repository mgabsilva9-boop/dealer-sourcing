/**
 * Padronizar respostas da API
 */

export class APIResponse {
  constructor(success, data, message = '', status = 200) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }

  static ok(data, message = 'Success') {
    return new APIResponse(true, data, message, 200);
  }

  static created(data, message = 'Created') {
    return new APIResponse(true, data, message, 201);
  }

  static badRequest(message = 'Bad Request') {
    return new APIResponse(false, null, message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new APIResponse(false, null, message, 401);
  }

  static notFound(message = 'Not Found') {
    return new APIResponse(false, null, message, 404);
  }

  static serverError(message = 'Internal Server Error') {
    return new APIResponse(false, null, message, 500);
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}
