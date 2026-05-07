# Good First Issue Backlog — Stayvora Partner Portal

These are ready-to-create GitHub issues for the public contributor backlog. Apply the `good first issue` label to each one.

## Improve Form Validation on GST and Bank Settings Page

The GST and bank account settings form accepts invalid input without clear feedback. Better inline validation would reduce support requests.

Acceptance criteria:
- GST number field validates the standard 15-character alphanumeric format on blur.
- IFSC code field validates the standard 11-character format.
- Account number field accepts digits only and shows a character count.
- All errors are visible and associated with their fields for screen readers.

## Add Confirmation Dialog Before Deactivating a Room Type

Deactivating a room type has no confirmation step, which can cause accidental data loss if a partner misclicks.

Acceptance criteria:
- A modal or inline confirmation appears when the deactivate button is clicked.
- The dialog names the room type to be deactivated.
- Cancel and confirm actions are both accessible by keyboard.
- No change to the underlying deactivation API call.

## Improve Empty State on the Booking Inbox

When a newly registered partner has no bookings, the inbox shows a blank area. An empty state with guidance would help orientation.

Acceptance criteria:
- Show an icon and copy explaining that bookings will appear here when guests book their rooms.
- Handle both "no bookings ever" and "no results for the current filter" separately.
- Responsive on mobile.

## Add Keyboard Accessibility to the Availability Calendar

The calendar grid for date-level inventory control is only mouse-accessible. Keyboard users cannot navigate or toggle dates.

Acceptance criteria:
- Arrow keys move focus between calendar cells.
- Enter or Space toggles a date's availability status.
- Each cell has an accessible label that includes the date and current status.
- Behavior is consistent with WCAG 2.1 AA keyboard interaction patterns.

## Write Unit Tests for Revenue Summary Calculations

The revenue summary component transforms raw API data into display values. These calculations are untested.

Acceptance criteria:
- At least one test per calculation function (total revenue, average per booking, payout estimate).
- Tests cover empty-data and single-booking edge cases.
- No mocking of the Angular HTTP client at the unit level.
