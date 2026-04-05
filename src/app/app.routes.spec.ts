import { routes } from './app.routes';

describe('partner routes', () => {
  it('exposes the core partner portal routes', () => {
    const paths = routes.map(route => route.path);
    expect(paths).toEqual(
      expect.arrayContaining(['login', 'register', '', 'rooms', 'bookings', 'calendar', 'payouts', 'settings'])
    );
  });
});
