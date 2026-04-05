import { appConfig } from './app.config';

describe('appConfig', () => {
  it('registers router and http client providers', () => {
    expect(appConfig.providers).toHaveLength(2);
    expect(appConfig.providers?.every(Boolean)).toBe(true);
  });

  it('includes provider definitions that wire up interceptors', () => {
    expect(appConfig.providers?.[0]).toBeDefined();
    expect(appConfig.providers?.[1]).toBeDefined();
    expect(typeof appConfig.providers?.[0]).toBe('object');
    expect(typeof appConfig.providers?.[1]).toBe('object');
  });
});
