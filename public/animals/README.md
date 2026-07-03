# Animal images (optional, photo-ready)

Drop licensed image files here and the app will use them automatically — no code
changes needed. If a file is absent, the app shows a clean on-brand illustration
instead (so the demo always works offline).

Expected filenames (all optional):

| File                     | Where it shows                                   |
| ------------------------ | ------------------------------------------------ |
| `horse.jpg`              | Thumbnail on horse shipments (cards, headers)    |
| `companion.jpg`          | Thumbnail on dog/cat shipments                   |
| `other.jpg`              | Thumbnail on other commodities                   |
| `hero.jpg`               | Banner on the login landing page                 |

Tips
- Use `.jpg` (or change the extension in `components/CommodityArt.tsx` /
  `components/Login.tsx`).
- Landscape crops work best for `hero.jpg` (shown ~44px tall, full width, cover).
- Thumbnails are shown square (cover), ~40–44px — a clear subject works best.
- Only use images you have the rights to. Nothing here is fetched from the web.
