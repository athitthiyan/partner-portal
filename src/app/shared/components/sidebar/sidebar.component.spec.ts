import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('renders all partner navigation items', () => {
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.sidebar__link')
    ).map(link => link.textContent?.trim());

    expect(labels).toEqual(expect.arrayContaining([
      'OVOverview',
      'RMRooms',
      'BKBookings',
      'CLCalendar',
      'POPayouts',
      'STSettings',
    ]));
  });

  it('toggles collapsed state', () => {
    const component = fixture.componentInstance;

    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);
  });
});
