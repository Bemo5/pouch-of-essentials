# OCR — Arabic receipt scanning (not implemented)

This folder is a placeholder. The goal is to let a user snap a photo of an
Arabic grocery receipt and have line items flow straight into the pouch.

## Planned approach

- **On-device first.** No receipt image should ever leave the phone.
- **Engine candidates:**
  - Google ML Kit Text Recognition v2 (supports Arabic) via a Capacitor / TWA
    wrapper if we ever ship a native shell.
  - `tesseract.js` with the `ara` traineddata as a pure-web fallback — slower
    and less accurate on receipts but works in any browser.
- **Pipeline sketch:**
  1. User taps a camera button, picks or captures an image.
  2. Pre-process (grayscale, deskew, threshold) in a canvas.
  3. Run OCR → raw text blocks with bounding boxes.
  4. Parse lines into `{ name, qty, price }` using a simple heuristic tuned
     for Arabic receipts (right-to-left columns, digits on the left).
  5. Show a review screen where the user edits / confirms items.
  6. Push each confirmed item through `addItem` in `useGroceryStore`.

## Public interface (provisional)

```js
import { scanReceipt, isOcrAvailable } from './ocr';

if (isOcrAvailable()) {
  const items = await scanReceipt(imageBlob);
  // items: [{ name, qty, price }]
}
```

Keeping the surface tiny here means the rest of the app can adopt OCR later
without touching import sites.
