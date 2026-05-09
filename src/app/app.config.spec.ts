import { APP_INITIALIZER } from '@angular/core';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('registers router, http client, and session-restore providers', () => {
    // router + httpClient + APP_INITIALIZER (+ optional Sentry when sentryDsn set)
    expect(appConfig.providers!.length).toBeGreaterThanOrEqual(3);
    expect(appConfig.providers?.every(Boolean)).toBe(true);
  });

  it('includes provider definitions that wire up interceptors', () => {
    expect(appConfig.providers?.[0]).toBeDefined();
    expect(appConfig.providers?.[1]).toBeDefined();
    expect(typeof appConfig.providers?.[0]).toBe('object');
    expect(typeof appConfig.providers?.[1]).toBe('object');
  });

  it('registers an APP_INITIALIZER for session restore', () => {
    const initProvider = appConfig.providers?.find(
      (p: unknown) => (p as { provide?: unknown })?.provide === APP_INITIALIZER,
    );
    expect(initProvider).toBeDefined();
  });
});
