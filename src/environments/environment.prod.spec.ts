import { environment } from './environment.prod';

describe('environment.prod', () => {
  it('re-exports the production environment', () => {
    expect(environment).toBeDefined();
    expect(environment.apiUrl).toBeDefined();
  });
});
