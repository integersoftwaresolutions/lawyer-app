export class ApiError extends Error {
  constructor(statusCode, message, errors = undefined, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}
