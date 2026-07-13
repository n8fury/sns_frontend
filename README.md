# sns frontend

Next.js frontend for Sketch & Sprint: a Kanban-style task manager (`/tasks`) and an image annotation tool (`/annotate`), backed by the Django API in `sns_backend`.

Live at `https://sns-frontend-seven.vercel.app` (API: `https://n8fury.pythonanywhere.com`).

## Tech stack

- Node v24 (developed on v24.15.0) / Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui (Radix primitives)
- Zustand (state), @dnd-kit (drag-and-drop), react-konva (annotation canvas)
- next-themes (light/dark), sonner (toasts)

## Setup

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Point it at the deployed API instead to run against production. On Vercel, the same variable is set in the project's Environment Variables.

Then:

```bash
npm run dev    # http://localhost:3000
npm run build  # production build (also the type/lint gate)
```

The backend must be running and seeded (`python manage.py seed_demo`) — there are no mocks.

## Demo credentials

```
email:    demo@example.com
password: DemoPass123!
```

## Pages

| route | what it does |
|---|---|
| `/login` | email + password → DRF token, mirrored to a cookie so middleware can guard routes server-side |
| `/tasks` | per-day Kanban board: date navigator, add/edit via modal, delete with confirm, drag cards between To Do / In Progress / Done (optimistic PATCH with rollback) |
| `/annotate` | upload images, scroll them in a carousel, draw click-to-place labeled polygons on a Konva canvas, select/delete them from a sidebar list |

Unauthenticated visits to `/tasks` / `/annotate` redirect to `/login`; any API 401 forces a logout.

## Villains faced

- **Konva vs SSR.** `react-konva` touches `window` at import time, so a normal import crashes `next build` with `window is not defined`. The canvas is loaded with `next/dynamic` and `ssr: false`, and everything Konva-related lives behind that boundary.
- **Polygons that drift off their image.** Vertices are stored in image-space coordinates, not screen pixels: every click is converted screen→image by the current fit-scale/offset, and every render converts back. That's what keeps a polygon glued to the same image feature through window resizes, container changes, and F5.
- **Browser zoom wedging the canvas.** Stage size and `devicePixelRatio` were measured in separate effects; a browser zoom could remount the Konva Stage with a stale size that ResizeObserver hadn't caught up to, permanently wedging it until a reload. Fixed by measuring both together from the same event.
- **The production black-canvas mystery.** Uploaded images rendered fine locally but came up black on the deployed site. Cause: the canvas image loader set `crossOrigin='anonymous'`, forcing a CORS-checked request — but in production the media files are served by PythonAnywhere's static mapping, which never goes through Django, so django-cors-headers can't attach the header and the browser silently fails the load. Nothing exports the canvas, so `crossOrigin` wasn't needed at all — removed.
- **The unclickable calendar caption.** Making the "July 2026" caption a drill-down button (month → year grids) did nothing on click. react-day-picker's nav bar is an absolutely-positioned, full-width strip overlaying the caption row, and absolutely-positioned elements capture clicks even in their transparent middle. Fixed with `pointer-events-none` on the nav and `pointer-events-auto` back on its two arrow buttons.
- **State resets without effect-lag.** Several components (canvas image loader, task modal, date picker views) need to reset local state when a prop changes. Doing that in `useEffect` leaves one render showing stale state (and the modal variant could wipe in-progress edits). They use React's documented adjust-state-during-render pattern instead.
