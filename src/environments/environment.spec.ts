import { environment as devEnvironment } from './environment';
import { environment as prodEnvironment } from './environment.production';

describe('partner environments', () => {
  it('exports the development environment config', () => {
    expect(devEnvironment.production).toBe(false);
    expect(devEnvironment.apiUrl).toBe('https://hotel-api-production-447d.up.railway.app');
    expect(devEnvironment.bookingAppUrl).toBe('https://stayease-booking-app.vercel.app/');
  });

  it('exports the production environment config', () => {
    expect(prodEnvironment.production).toBe(true);
    expect(prodEnvironment.apiUrl).toBe('https://hotel-api-production-447d.up.railway.app');
    expect(prodEnvironment.bookingAppUrl).toBe('https://stayease-booking-app.vercel.app');
  });
});
