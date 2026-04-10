import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// TODO: Add Sentry integration for error tracking and monitoring in production.
// This would help track partner portal issues and monitor business-critical booking operations.
// Example: import * as Sentry from "@sentry/angular"; Sentry.init({ dsn: "..." });

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
