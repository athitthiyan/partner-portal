<div align="center">

# Stayvora Partner Portal

Hotel-partner dashboard for inventory management, booking operations, and revenue tracking.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI](https://github.com/athitthiyan/partner-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/athitthiyan/partner-portal/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live App:** [partner.stayvora.co.in](https://partner.stayvora.co.in) | **Platform:** [stayvora.co.in](https://stayvora.co.in)

</div>

---

## About

The **Stayvora Partner Portal** is the hotel-owner surface of the Stayvora platform. Partners use it to manage their property profile, control room inventory and pricing, view incoming bookings, and track revenue and payout summaries.

## Features

- Partner registration and login
- Hotel profile management with GST and bank account settings
- Room inventory management: add, edit, and deactivate room types
- Booking inbox with status tracking
- Availability calendar for date-level inventory control
- Revenue dashboard and payout summary

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Angular 17 standalone components |
| Language | TypeScript strict mode |
| Styling | SCSS |
| State | Angular Signals |
| HTTP | Angular HttpClient |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/athitthiyan/partner-portal.git
cd partner-portal
npm install
npm start
```

The dev server runs at [http://localhost:4203](http://localhost:4203).

### Scripts

```bash
npm run start      # dev server
npm run build      # development build
npm run lint       # ESLint check
npm run test       # unit tests
```

## Architecture

```text
Hotel Partner
    |
    -> Partner Portal (this repo)
         |
         -> HotelAPI (Railway) -- inventory, bookings, payouts
```

## Connected Apps

| App | Repository | Purpose |
| --- | --- | --- |
| Stayvora Booking | [athitthiyan/stayease-booking-app](https://github.com/athitthiyan/stayease-booking-app) | Guest-facing booking frontend |
| PayFlow | [athitthiyan/payflow-payment-app](https://github.com/athitthiyan/payflow-payment-app) | Payment processing |
| InsightBoard | [athitthiyan/insightboard-admin](https://github.com/athitthiyan/insightboard-admin) | Admin analytics dashboard |
| HotelAPI | [athitthiyan/hotelapi-backend](https://github.com/athitthiyan/hotelapi-backend) | Shared backend API |

## Deployment

Configured for Vercel SPA hosting. `vercel.json` sets the build command to `npm run build:prod` and rewrites all routes to `index.html` for client-side routing.

## Contributing

Contributions are welcome -- bug reports, feature ideas, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](LICENSE).
