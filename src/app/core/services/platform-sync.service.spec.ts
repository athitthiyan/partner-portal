import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PlatformEvent, PlatformSyncService } from './platform-sync.service';

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = jest.fn(() => {
    this.onclose?.();
  });

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }
}

describe('PlatformSyncService', () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalLocalStorage = globalThis.localStorage;
  let service: PlatformSyncService;

  beforeEach(() => {
    MockWebSocket.instances = [];
    Object.defineProperty(globalThis, 'WebSocket', {
      writable: true,
      value: MockWebSocket,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      writable: true,
      value: {
        getItem: jest.fn().mockReturnValue('access-token'),
      },
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatformSyncService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    Object.defineProperty(globalThis, 'WebSocket', { writable: true, value: originalWebSocket });
    Object.defineProperty(globalThis, 'localStorage', { writable: true, value: originalLocalStorage });
    jest.restoreAllMocks();
  });

  it('connects with a websocket URL based on the API URL and resets reconnect state on open', () => {
    service.connect();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]?.url).toBe('ws://127.0.0.1:8000/ws/events?token=access-token');

    MockWebSocket.instances[0]?.onopen?.();

    expect(service.connected()).toBe(true);
  });

  it('uses an empty token when no access token is stored', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      writable: true,
      value: {
        getItem: jest.fn().mockReturnValue(null),
      },
    });

    service.connect();

    expect(MockWebSocket.instances[0]?.url).toBe('ws://127.0.0.1:8000/ws/events?token=');
  });

  it('parses websocket events and ignores malformed payloads', () => {
    const received: PlatformEvent[] = [];
    service.onEvent$.subscribe(event => received.push(event));
    service.connect();

    MockWebSocket.instances[0]?.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({
          type: 'booking-created',
          payload: { id: 10 },
          timestamp: '2026-04-08T00:00:00.000Z',
          source: 'system',
        }),
      }),
    );
    MockWebSocket.instances[0]?.onmessage?.(
      new MessageEvent('message', {
        data: '{bad json',
      }),
    );

    expect(received).toEqual([
      {
        type: 'booking-created',
        payload: { id: 10 },
        timestamp: '2026-04-08T00:00:00.000Z',
        source: 'system',
      },
    ]);
    expect(service.lastEvent()).toEqual(received[0]);
  });

  it('filters events by type and emits manually published events', () => {
    const roomEvents: PlatformEvent[] = [];
    const refundEvents: PlatformEvent[] = [];

    service.on('room-updated').subscribe(event => roomEvents.push(event));
    service.onAny('refund-initiated').subscribe(event => refundEvents.push(event));

    service.emit({
      type: 'room-updated',
      payload: { action: 'manual-refresh' },
      timestamp: '2026-04-08T00:00:00.000Z',
      source: 'partner',
    });
    service.emit({
      type: 'refund-initiated',
      payload: { bookingId: 7 },
      timestamp: '2026-04-08T00:00:00.000Z',
      source: 'admin',
    });

    expect(roomEvents).toHaveLength(1);
    expect(refundEvents).toHaveLength(1);
  });

  it('falls back to polling when websocket construction throws', fakeAsync(() => {
    Object.defineProperty(globalThis, 'WebSocket', {
      writable: true,
      value: jest.fn(() => {
        throw new Error('socket unavailable');
      }),
    });

    const emitted: PlatformEvent[] = [];
    service.onEvent$.subscribe(event => emitted.push(event));

    service.connect();
    tick(15000);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.payload).toEqual({ action: 'poll-refresh' });
    service.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('reconnects on close, then falls back to polling after repeated failures', fakeAsync(() => {
    const emitted: PlatformEvent[] = [];
    service.onEvent$.subscribe(event => emitted.push(event));

    service.connect();
    MockWebSocket.instances[0]?.onclose?.();

    tick(2000);
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);

    for (let index = 1; index < 6; index += 1) {
      MockWebSocket.instances[index]?.onclose?.();
      tick(Math.min(1000 * Math.pow(2, index + 1), 30000));
    }

    tick(15000);
    expect(emitted.at(-1)?.payload).toEqual({ action: 'poll-refresh' });
    service.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('starts polling when websocket errors and cleans up on destroy', fakeAsync(() => {
    service.connect();
    const socket = MockWebSocket.instances[0];
    const closeSpy = socket?.close;

    socket?.onerror?.();
    tick(15000);

    expect(service.connected()).toBe(false);
    expect(closeSpy).toHaveBeenCalled();

    service.ngOnDestroy();
    tick(15000);

    expect(service.connected()).toBe(false);
    discardPeriodicTasks();
  }));
});
