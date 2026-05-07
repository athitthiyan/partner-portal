# Contributing to Stayvora Partner Portal

Thanks for helping improve the Partner Portal. This project welcomes bug reports, feature ideas, documentation fixes, and tests.

## Ways to Contribute

- Pick an issue labeled `good first issue` or `help wanted`.
- Report a bug with expected behavior, actual behavior, screenshots if useful, and reproduction steps.
- Suggest a feature by describing the hotel-partner workflow problem it solves.
- Improve test coverage, accessibility, or documentation.

## Local Setup

```bash
npm install
npm start
```

The app runs at [http://localhost:4203](http://localhost:4203).

You'll need a running HotelAPI instance (see [hotelapi-backend](https://github.com/athitthiyan/hotelapi-backend)) or the live API configured in `environment.ts`.

## Before Opening a Pull Request

```bash
npm run lint
npm test
npm run build
```

## Pull Request Guidelines

- Keep PRs focused on one behavior or improvement.
- Include screenshots for UI changes.
- Add or update tests when behavior changes.
- Describe any new backend API endpoints or permission requirements.

## Good First Issue Ideas

- Improve form validation messages on the GST and bank settings page.
- Add a confirmation dialog before deactivating a room type.
- Improve the empty state on the booking inbox when no bookings are pending.
- Add keyboard accessibility to the availability calendar grid.
- Write unit tests for the revenue-summary data-transformation logic.
