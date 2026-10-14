# HomeFix Team Coding & Git Rules

- Maintain Express architecture in `backend/src/` (config, controllers, models, routes, middlewares, validators).
- Never commit `.env` or files containing secret keys to Git.
- Always use `snake_case` for database columns and JSON response fields.
- Always format API responses using `{ success: boolean, message: string, data?: object, errors?: array }`.
- Run `npm test` inside `backend/` before any git commit or push to verify zero regression.
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
