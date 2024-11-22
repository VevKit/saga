export class SagaError extends Error {
  constructor(code: string, message: string) {
    super(`SAG-${code}: ${message}`);
    this.name = 'SagaError';
  }
};
