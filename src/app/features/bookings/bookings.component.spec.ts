import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { BookingsComponent } from './bookings.component';
import { PartnerService } from '../../core/services/partner.service';
import { PlatformSyncService } from '../../core/services/platform-sync.service';
import { provideRouter } from '@angular/router';
import { PartnerBooking, PartnerBookingListResponse } from '../../core/models/partner.model';

describe('BookingsComponent', () => {
  let component: BookingsComponent;
  let fixture: ComponentFixture<BookingsComponent>;
  let partnerService: jest.Mocked<PartnerService>;
  let platformSyncService: jest.Mocked<PlatformSyncService>;

  // Test data fixtures
  const createBooking = (overrides: Partial<PartnerBooking> = {}): PartnerBooking => ({
    id: 1,
    booking_ref: 'BK001',
    user_name: 'John Doe',
    email: 'john@example.com',
    check_in: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    check_out: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    guests: 2,
    adults: 2,
    children: 0,
    infants: 0,
    total_amount: 5000,
    status: 'confirmed',
    payment_status: 'paid',
    ...overrides,
  });

  const mockActiveBooking = createBooking({
    id: 1,
    booking_ref: 'BK001',
    user_name: 'John Doe',
    status: 'confirmed',
    payment_status: 'paid',
  });

  const mockPendingBooking = createBooking({
    id: 2,
    booking_ref: 'BK002',
    user_name: 'Jane Smith',
    status: 'pending',
    payment_status: 'pending',
  });

  const mockProcessingBooking = createBooking({
    id: 3,
    booking_ref: 'BK003',
    user_name: 'Bob Johnson',
    status: 'processing',
    payment_status: 'failed',
  });

  const mockPastBooking = createBooking({
    id: 4,
    booking_ref: 'BK004',
    user_name: 'Alice Brown',
    status: 'completed',
    payment_status: 'paid',
    check_in: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    check_out: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const mockCancelledBooking = createBooking({
    id: 5,
    booking_ref: 'BK005',
    user_name: 'Charlie Davis',
    status: 'cancelled',
    payment_status: 'refunded',
    refund_status: 'refund_success',
  });

  const mockPastConfirmedBooking = createBooking({
    id: 6,
    booking_ref: 'BK006',
    user_name: 'Diana Evans',
    status: 'confirmed',
    payment_status: 'paid',
    check_in: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    check_out: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  });

  beforeEach(async () => {
    const partnerServiceMock = {
      getBookings: jest.fn().mockReturnValue(of({
        bookings: [mockActiveBooking, mockPendingBooking],
        total: 2,
      } as PartnerBookingListResponse)),
      acceptBooking: jest.fn(),
      rejectBooking: jest.fn(),
    };

    const platformSyncServiceMock = {
      connect: jest.fn(),
      onAny: jest.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [BookingsComponent],
      providers: [
        { provide: PartnerService, useValue: partnerServiceMock },
        { provide: PlatformSyncService, useValue: platformSyncServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    partnerService = TestBed.inject(PartnerService) as jest.Mocked<PartnerService>;
    platformSyncService = TestBed.inject(PlatformSyncService) as jest.Mocked<PlatformSyncService>;

    fixture = TestBed.createComponent(BookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load bookings via PartnerService.getBookings() on init', () => {
      expect(partnerService.getBookings).toHaveBeenCalled();
    });

    it('should initialize realtime sync on component init', () => {
      expect(platformSyncService.connect).toHaveBeenCalled();
    });

    it('should set active tab to "active" by default', () => {
      expect(component.activeTab()).toBe('active');
    });
  });

  describe('Tab Management', () => {
    it('should have three tabs: active, past, cancelled', () => {
      expect(component.tabs.length).toBe(3);
      expect(component.tabs[0].key).toBe('active');
      expect(component.tabs[1].key).toBe('past');
      expect(component.tabs[2].key).toBe('cancelled');
    });

    it('should change active tab when setTab is called', () => {
      component.setTab('past');
      expect(component.activeTab()).toBe('past');

      component.setTab('cancelled');
      expect(component.activeTab()).toBe('cancelled');

      component.setTab('active');
      expect(component.activeTab()).toBe('active');
    });
  });

  describe('filteredBookings()', () => {
    it('returns all bookings for unsupported tab keys', () => {
      component.activeTab.set('unknown' as never);

      expect(component.filteredBookings()).toEqual(component.allBookings());
    });

    it('should filter to active bookings (confirmed/pending/processing with future checkout)', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking, mockPendingBooking, mockProcessingBooking, mockCancelledBooking, mockPastBooking],
        total: 5,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('active');
      const filtered = component.filteredBookings();

      expect(filtered).toContain(mockActiveBooking);
      expect(filtered).toContain(mockPendingBooking);
      expect(filtered).toContain(mockProcessingBooking);
      expect(filtered).not.toContain(mockCancelledBooking);
      expect(filtered).not.toContain(mockPastBooking);
    });

    it('should filter to past bookings (completed or confirmed with past checkout)', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking, mockPastBooking, mockPastConfirmedBooking, mockCancelledBooking],
        total: 4,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('past');
      const filtered = component.filteredBookings();

      expect(filtered).toContain(mockPastBooking);
      expect(filtered).toContain(mockPastConfirmedBooking);
      expect(filtered).not.toContain(mockActiveBooking);
      expect(filtered).not.toContain(mockCancelledBooking);
    });

    it('should filter to cancelled bookings only', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking, mockCancelledBooking, mockPastBooking],
        total: 3,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('cancelled');
      const filtered = component.filteredBookings();

      expect(filtered).toContain(mockCancelledBooking);
      expect(filtered).not.toContain(mockActiveBooking);
      expect(filtered).not.toContain(mockPastBooking);
      expect(filtered.length).toBe(1);
    });

    it('should return empty array when no bookings match the current tab', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking],
        total: 1,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('past');
      const filtered = component.filteredBookings();

      expect(filtered.length).toBe(0);
    });
  });

  describe('tabCounts()', () => {
    it('should return correct counts for each tab', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [
          mockActiveBooking,
          mockPendingBooking,
          mockCancelledBooking,
          mockPastBooking,
          mockPastConfirmedBooking,
        ],
        total: 5,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const counts = component.tabCounts();

      expect(counts.active).toBe(2); // confirmed + pending
      expect(counts.past).toBe(2); // completed + confirmed with past checkout
      expect(counts.cancelled).toBe(1);
    });

    it('should return zero counts when no bookings exist', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [],
        total: 0,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const counts = component.tabCounts();

      expect(counts.active).toBe(0);
      expect(counts.past).toBe(0);
      expect(counts.cancelled).toBe(0);
    });
  });

  describe('canTakeAction()', () => {
    it('should return true for pending status bookings', () => {
      expect(component.canTakeAction(mockPendingBooking)).toBe(true);
    });

    it('should return true for processing status bookings', () => {
      expect(component.canTakeAction(mockProcessingBooking)).toBe(true);
    });

    it('should return false for confirmed status bookings', () => {
      expect(component.canTakeAction(mockActiveBooking)).toBe(false);
    });

    it('should return false for completed status bookings', () => {
      expect(component.canTakeAction(mockPastBooking)).toBe(false);
    });

    it('should return false for cancelled status bookings', () => {
      expect(component.canTakeAction(mockCancelledBooking)).toBe(false);
    });
  });

  describe('acceptBooking()', () => {
    it('should call partnerService.acceptBooking with booking id', () => {
      partnerService.acceptBooking.mockReturnValue(of({ id: mockPendingBooking.id, status: 'confirmed', message: 'Booking accepted' }));

      component.acceptBooking(mockPendingBooking);

      expect(partnerService.acceptBooking).toHaveBeenCalledWith(mockPendingBooking.id);
    });

    it('should set actionLoading to true while processing', () => {
      const response$ = new Subject<{ id: number; status: string; message: string }>();
      partnerService.acceptBooking.mockReturnValue(response$.asObservable());

      component.actionLoading.set(false);
      component.acceptBooking(mockPendingBooking);

      expect(component.actionLoading()).toBe(true);

      response$.next({ id: mockPendingBooking.id, status: 'confirmed', message: 'Booking accepted' });
      response$.complete();
    });

    it('should display success message on successful acceptance', (done) => {
      const mockResponse = { id: mockPendingBooking.id, status: 'confirmed', message: 'Booking successfully accepted' };
      partnerService.acceptBooking.mockReturnValue(of(mockResponse));

      component.acceptBooking(mockPendingBooking);

      setTimeout(() => {
        expect(component.actionMessage()).toContain('accepted');
        expect(component.actionLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should set actionError and clear actionMessage on failure', (done) => {
      const mockError = { error: { detail: 'Failed to accept booking due to server error' } };
      partnerService.acceptBooking.mockReturnValue(throwError(() => mockError));

      component.acceptBooking(mockPendingBooking);

      setTimeout(() => {
        expect(component.actionError()).toContain('Failed');
        expect(component.actionMessage()).toBe('');
        expect(component.actionLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should track lastActionBookingId', (done) => {
      partnerService.acceptBooking.mockReturnValue(of({ id: mockPendingBooking.id, status: 'confirmed', message: 'Booking accepted' }));

      component.acceptBooking(mockPendingBooking);

      setTimeout(() => {
        expect(component.lastActionBookingId()).toBe(mockPendingBooking.id);
        done();
      }, 10);
    });
  });

  describe('rejectBooking()', () => {
    it('should call partnerService.rejectBooking with booking id', () => {
      partnerService.rejectBooking.mockReturnValue(of({ id: mockPendingBooking.id, status: 'cancelled', refund_initiated: false, message: 'Booking rejected' }));

      component.rejectBooking(mockPendingBooking);

      expect(partnerService.rejectBooking).toHaveBeenCalledWith(mockPendingBooking.id);
    });

    it('should display success message on successful rejection', (done) => {
      const mockResponse = { id: mockPendingBooking.id, status: 'cancelled', refund_initiated: true, message: 'Booking successfully rejected and refunded' };
      partnerService.rejectBooking.mockReturnValue(of(mockResponse));

      component.rejectBooking(mockPendingBooking);

      setTimeout(() => {
        expect(component.actionMessage()).toContain('rejected');
        expect(component.actionLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should handle rejection errors gracefully', (done) => {
      const mockError = { error: { detail: 'Cannot reject booking at this stage' } };
      partnerService.rejectBooking.mockReturnValue(throwError(() => mockError));

      component.rejectBooking(mockPendingBooking);

      setTimeout(() => {
        expect(component.actionError()).toContain('Cannot reject');
        expect(component.actionLoading()).toBe(false);
        done();
      }, 10);
    });
  });

  describe('formatGuests()', () => {
    it('should format guests with adults, children, and infants', () => {
      const booking = createBooking({
        adults: 2,
        children: 1,
        infants: 1,
      });

      const result = component.formatGuests(booking);

      expect(result).toContain('2 Adults');
      expect(result).toContain('1 Child');
      expect(result).toContain('1 Infant');
      expect(result).toContain('·');
    });

    it('should format guests with only adults', () => {
      const booking = createBooking({
        adults: 2,
        children: 0,
        infants: 0,
      });

      const result = component.formatGuests(booking);

      expect(result).toBe('2 Adults');
    });

    it('should format guests with adults and children', () => {
      const booking = createBooking({
        adults: 1,
        children: 2,
        infants: 0,
      });

      const result = component.formatGuests(booking);

      expect(result).toBe('1 Adult · 2 Children');
    });

    it('should handle singular forms correctly', () => {
      const booking = createBooking({
        adults: 1,
        children: 1,
        infants: 1,
      });

      const result = component.formatGuests(booking);

      expect(result).toContain('1 Adult');
      expect(result).toContain('1 Child');
      expect(result).toContain('1 Infant');
    });

    it('should use guests count as fallback when breakdown is not available', () => {
      const booking = createBooking({
        guests: 3,
        adults: 0,
        children: 0,
        infants: 0,
      });

      const result = component.formatGuests(booking);

      expect(result).toBe('3 guests');
    });

    it('should return dash when no guest information is available', () => {
      const booking = createBooking({
        guests: 0,
        adults: 0,
        children: 0,
        infants: 0,
      });

      const result = component.formatGuests(booking);

      expect(result).toBe('-');
    });
  });

  describe('formatRefundStatus()', () => {
    it('should map refund_requested to "Refund Requested"', () => {
      expect(component.formatRefundStatus('refund_requested')).toBe('Refund Requested');
    });

    it('should map refund_initiated to "Refund Initiated"', () => {
      expect(component.formatRefundStatus('refund_initiated')).toBe('Refund Initiated');
    });

    it('should map refund_processing to "Refund Processing"', () => {
      expect(component.formatRefundStatus('refund_processing')).toBe('Refund Processing');
    });

    it('should map refund_success to "Refund Complete"', () => {
      expect(component.formatRefundStatus('refund_success')).toBe('Refund Complete');
    });

    it('should map refund_failed to "Refund Failed"', () => {
      expect(component.formatRefundStatus('refund_failed')).toBe('Refund Failed');
    });

    it('should map refund_reversed to "Refund Reversed"', () => {
      expect(component.formatRefundStatus('refund_reversed')).toBe('Refund Reversed');
    });

    it('should return unmapped status as is', () => {
      expect(component.formatRefundStatus('unknown_status')).toBe('unknown_status');
    });
  });

  describe('getTimeline()', () => {
    it('should return cancelled timeline for cancelled bookings', () => {
      const timeline = component.getTimeline(mockCancelledBooking);

      expect(timeline.length).toBe(2);
      expect(timeline[0].label).toBe('Booked');
      expect(timeline[0].done).toBe(true);
      expect(timeline[1].label).toBe('Cancelled');
      expect(timeline[1].done).toBe(true);
      expect(timeline[1].current).toBe(true);
    });

    it('should return correct timeline for future confirmed booking', () => {
      const timeline = component.getTimeline(mockActiveBooking);

      expect(timeline[0].label).toBe('Confirmed');
      expect(timeline[0].done).toBe(true);
      expect(timeline[1].label).toBe('Checked In');
      expect(timeline[1].done).toBe(false);
      expect(timeline[2].label).toBe('Checked Out');
      expect(timeline[2].done).toBe(false);
    });

    it('should mark confirmed as done for completed bookings', () => {
      const timeline = component.getTimeline(mockPastBooking);

      expect(timeline[0].label).toBe('Confirmed');
      expect(timeline[0].done).toBe(true);
    });

    it('should mark checked in as current for ongoing stays', () => {
      const now = new Date();
      const checkIn = new Date(now.getTime() - 1000);
      const checkOut = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const booking = createBooking({
        status: 'confirmed',
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
      });

      const timeline = component.getTimeline(booking);

      expect(timeline[1].label).toBe('Checked In');
      expect(timeline[1].current).toBe(true);
    });

    it('should return fallback timeline when dates are missing', () => {
      const booking = createBooking({
        status: 'confirmed',
        check_in: undefined as unknown as string,
        check_out: undefined as unknown as string,
      });

      const timeline = component.getTimeline(booking);

      expect(timeline.length).toBe(3);
      expect(timeline[0].label).toBe('Confirmed');
      expect(timeline[0].done).toBe(true);
      expect(timeline[0].current).toBe(true);
      expect(timeline[1].label).toBe('Checked In');
      expect(timeline[1].done).toBe(false);
      expect(timeline[2].label).toBe('Checked Out');
      expect(timeline[2].done).toBe(false);
    });

    it('should mark checked out as done after checkout', () => {
      const timeline = component.getTimeline(mockPastConfirmedBooking);

      expect(timeline[2].label).toBe('Checked Out');
      expect(timeline[2].done).toBe(true);
    });
  });

  describe('Status Colors', () => {
    it('should return correct color for confirmed status', () => {
      expect(component.getStatusColor('confirmed')).toBe('#4ade80');
    });

    it('should return correct background for confirmed status', () => {
      expect(component.getStatusBg('confirmed')).toBe('rgba(34,197,94,0.15)');
    });

    it('should return correct color for pending status', () => {
      expect(component.getStatusColor('pending')).toBe('#fbbf24');
    });

    it('should return correct background for pending status', () => {
      expect(component.getStatusBg('pending')).toBe('rgba(251,191,36,0.15)');
    });

    it('should return correct color for processing status', () => {
      expect(component.getStatusColor('processing')).toBe('#60a5fa');
    });

    it('should return correct background for processing status', () => {
      expect(component.getStatusBg('processing')).toBe('rgba(96,165,250,0.15)');
    });

    it('should return correct color for cancelled status', () => {
      expect(component.getStatusColor('cancelled')).toBe('#f87171');
    });

    it('should return correct background for cancelled status', () => {
      expect(component.getStatusBg('cancelled')).toBe('rgba(239,68,68,0.15)');
    });

    it('should return correct color for completed status', () => {
      expect(component.getStatusColor('completed')).toBe('#818cf8');
    });

    it('should return correct background for completed status', () => {
      expect(component.getStatusBg('completed')).toBe('rgba(99,102,241,0.15)');
    });

    it('should return default color for unknown status', () => {
      expect(component.getStatusColor('unknown')).toBe('#9ca3af');
    });

    it('should return default background for unknown status', () => {
      expect(component.getStatusBg('unknown')).toBe('rgba(107,114,128,0.1)');
    });
  });

  describe('Payment Colors', () => {
    it('should return correct color for paid payment status', () => {
      expect(component.getPaymentColor('paid')).toBe('#4ade80');
    });

    it('should return correct background for paid payment status', () => {
      expect(component.getPaymentBg('paid')).toBe('rgba(34,197,94,0.15)');
    });

    it('should return correct color for pending payment status', () => {
      expect(component.getPaymentColor('pending')).toBe('#fbbf24');
    });

    it('should return correct background for pending payment status', () => {
      expect(component.getPaymentBg('pending')).toBe('rgba(251,191,36,0.15)');
    });

    it('should return correct color for failed payment status', () => {
      expect(component.getPaymentColor('failed')).toBe('#f87171');
    });

    it('should return correct background for failed payment status', () => {
      expect(component.getPaymentBg('failed')).toBe('rgba(239,68,68,0.15)');
    });

    it('should return correct color for refunded payment status', () => {
      expect(component.getPaymentColor('refunded')).toBe('#a78bfa');
    });

    it('should return correct background for refunded payment status', () => {
      expect(component.getPaymentBg('refunded')).toBe('rgba(167,139,250,0.15)');
    });

    it('should return default color for unknown payment status', () => {
      expect(component.getPaymentColor('unknown')).toBe('#9ca3af');
    });

    it('should return default background for unknown payment status', () => {
      expect(component.getPaymentBg('unknown')).toBe('rgba(107,114,128,0.1)');
    });
  });

  describe('Empty State Messages', () => {
    it('should return active booking icon and messages for active tab', () => {
      component.setTab('active');

      expect(component.emptyIcon()).toBe('🏨');
      expect(component.emptyTitle()).toBe('No active bookings');
      expect(component.emptySubtitle()).toBe('Active bookings from guests will appear here.');
    });

    it('should return past booking icon and messages for past tab', () => {
      component.setTab('past');

      expect(component.emptyIcon()).toBe('📸');
      expect(component.emptyTitle()).toBe('No past bookings yet');
      expect(component.emptySubtitle()).toBe('Completed guest stays will show here.');
    });

    it('should return celebration icon and messages for cancelled tab', () => {
      component.setTab('cancelled');

      expect(component.emptyIcon()).toBe('🎉');
      expect(component.emptyTitle()).toBe('No cancellations');
      expect(component.emptySubtitle()).toBe('Great — all bookings are proceeding smoothly!');
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('reads bookings from the signal source before any refresh cache exists', () => {
      platformSyncService.onAny.mockReturnValueOnce(new Subject());

      const signalFixture = TestBed.createComponent(BookingsComponent);
      const signalComponent = signalFixture.componentInstance;
      signalFixture.detectChanges();

      expect(signalComponent['_bookingsCache' as never]).toBeNull();
      expect(signalComponent.allBookings()).toEqual([mockActiveBooking, mockPendingBooking]);
    });

    it('should render booking data from service in template', () => {
      const native = fixture.nativeElement as HTMLElement;

      expect(native.textContent).toContain('BK001');
      expect(native.textContent).toContain('John Doe');
      expect(native.textContent).toContain('confirmed');
    });

    it('should update filtered bookings when tab changes', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking, mockCancelledBooking],
        total: 2,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('active');
      expect(component.filteredBookings().length).toBeGreaterThan(0);

      component.setTab('cancelled');
      expect(component.filteredBookings().some(b => b.status === 'cancelled')).toBe(true);
    });

    it('should display action buttons only for pending/processing bookings', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockPendingBooking, mockActiveBooking],
        total: 2,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const pendingAction = component.canTakeAction(mockPendingBooking);
      const confirmedAction = component.canTakeAction(mockActiveBooking);

      expect(pendingAction).toBe(true);
      expect(confirmedAction).toBe(false);
    });

    it('should handle empty bookings list gracefully', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [],
        total: 0,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.allBookings().length).toBe(0);
      expect(component.filteredBookings().length).toBe(0);
      expect(component.tabCounts().active).toBe(0);
      expect(component.tabCounts().past).toBe(0);
      expect(component.tabCounts().cancelled).toBe(0);
    });
  });

  describe('Realtime Sync', () => {
    it('should subscribe to platform sync events on init', () => {
      expect(platformSyncService.onAny).toHaveBeenCalledWith(
        'booking-created',
        'booking-confirmed',
        'booking-cancelled',
        'booking-expired',
        'payment-completed',
        'refund-initiated',
        'refund-completed',
        'inventory-updated'
      );
    });

    it('should refresh bookings on platform sync events', () => {
      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking],
        total: 1,
      }));

      fixture = TestBed.createComponent(BookingsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Trigger a manual refresh
      const newBooking = createBooking({
        id: 10,
        booking_ref: 'BK010',
        status: 'confirmed',
      });

      partnerService.getBookings.mockReturnValue(of({
        bookings: [mockActiveBooking, newBooking],
        total: 2,
      }));

      // Re-subscribe to simulate refresh
      component['refreshBookings']();

      expect(partnerService.getBookings).toHaveBeenCalled();
    });
  });
});
