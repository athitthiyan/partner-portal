import { environment as devEnvironment } from './environment';
import { environment as prodEnvironment } from './environment.production';

describe('partner environments', () => {
  it('exports the development environment config', () => {
    expect(devEnvironment.production).toBe(false);
    expect(devEnvironment.apiUrl).toBe('http://127.0.0.1:8000');
    expect(devEnvironment.apiBaseUrl).toBe('http://127.0.0.1:8000');
    expect(devEnvironment.bookingAppUrl).toBe('http://localhost:4200');
    expect(devEnvironment.partnerPortalUrl).toBe('http://localhost:4203');
  });

  it('exports the production environment config', () => {
    expect(prodEnvironment.production).toBe(true);
    expect(prodEnvironment.apiUrl).toBe('https://hotel-api-production-447d.up.railway.app');
    expect(prodEnvironment.apiBaseUrl).toBe('https://hotel-api-production-447d.up.railway.app');
    expect(prodEnvironment.bookingAppUrl).toBe('https://stayvora.co.in');
    expect(prodEnvironment.partnerPortalUrl).toBe('https://partner-portal.vercel.app');
  });
});
