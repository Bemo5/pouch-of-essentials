// Placeholder for Arabic receipt OCR.
//
// Intentionally not implemented yet. See ./README.md for the plan.
//
// The public interface below is provisional so callers can be wired up later
// without re-touching import sites.

export async function scanReceipt(/* imageBlob */) {
  throw new Error('OCR not implemented yet. See src/ocr/README.md');
}

export const isOcrAvailable = () => false;
