import { routes } from './app.routes';

describe('partner routes', () => {
  it('exposes the core partner portal routes', () => {
    const paths = routes.map(route => route.path);
    expect(paths).toEqual(
      expect.arrayContaining(['login', 'register', '', 'rooms', 'bookings', 'calendar', 'payouts', 'settings'])
    );
  });

  it('protects the partner workspace routes and configures titles', () => {
    const protectedPaths = ['', 'rooms', 'bookings', 'calendar', 'payouts', 'settings'];

    for (const path of protectedPaths) {
      const route = routes.find(candidate => candidate.path === path);
      expect(route?.canActivate).toHaveLength(1);
      expect(typeof route?.title).toBe('string');
    }
  });

  it('keeps auth routes public and redirects unknown paths', () => {
    const loginRoute = routes.find(route => route.path === 'login');
    const registerRoute = routes.find(route => route.path === 'register');
    const wildcardRoute = routes.find(route => route.path === '**');

    expect(loginRoute?.canActivate).toBeUndefined();
    expect(registerRoute?.canActivate).toBeUndefined();
    expect(wildcardRoute?.redirectTo).toBe('');
  });

  it('resolves every lazy loaded component', async () => {
    for (const route of routes.filter(candidate => candidate.loadComponent)) {
      const component = await route.loadComponent?.();
      expect(component).toBeDefined();
    }
  });
});
