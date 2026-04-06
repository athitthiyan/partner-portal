import { environment } from './environment';
import { environment as prodEnvironment } from './environment.production';

describe('Environment', () => {
  it('should have production false in dev', () => {
    expect(environment.production).toBeFalsy();
  });

  it('should have production true in prod', () => {
    expect(prodEnvironment.production).toBe(true);
    expect(prodEnvironment.apiUrl).toBe('https://hotel-api-production-447d.up.railway.app');
  });
});
