# HomeFix FE2 integration

This package combines the main backend with the existing FE3 frontend, and adds a customer booking-history/status page (`/my-bookings`).

- `VITE_USE_MOCK=true` (default) uses clearly labeled sample bookings on that page.
- `VITE_USE_MOCK=false` requests `GET /api/bookings` with JWT and displays a clear error when the endpoint is unavailable.
- Authentication continues using `localStorage.token` as the existing FE3 code expects; do not mix with `homefix_token`.
- Booking creation `/booking` is still a placeholder; admin bookings/services/dashboard depend on backend endpoints and are not claimed functional.
- Existing backend files are kept unchanged.

Run: `cd FE && npm install && npm run dev`. Copy `.env.example` to `.env` and adjust `VITE_API_URL`.
