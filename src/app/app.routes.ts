import { Routes } from '@angular/router';
import { partnerAuthGuard } from './core/guards/partner-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Partner Login - StayEase',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
    title: 'Partner Registration - StayEase',
  },
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [partnerAuthGuard],
    title: 'Partner Dashboard - StayEase',
  },
  {
    path: 'rooms',
    loadComponent: () => import('./features/rooms/rooms.component').then(m => m.RoomsComponent),
    canActivate: [partnerAuthGuard],
    title: 'Rooms - StayEase Partner Portal',
  },
  {
    path: 'bookings',
    loadComponent: () => import('./features/bookings/bookings.component').then(m => m.BookingsComponent),
    canActivate: [partnerAuthGuard],
    title: 'Bookings - StayEase Partner Portal',
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    canActivate: [partnerAuthGuard],
    title: 'Availability Calendar - StayEase Partner Portal',
  },
  {
    path: 'payouts',
    loadComponent: () => import('./features/payouts/payouts.component').then(m => m.PayoutsComponent),
    canActivate: [partnerAuthGuard],
    title: 'Payouts - StayEase Partner Portal',
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [partnerAuthGuard],
    title: 'Hotel Settings - StayEase Partner Portal',
  },
  { path: '**', redirectTo: '' },
];
