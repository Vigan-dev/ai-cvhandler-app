# CV-Handler Frontend

Next.js application for browser-local CV analysis and candidate management.

The interface uses system fonts and does not require a network request for font
assets.

## Architecture

- Raw CV files remain in browser memory during analysis.
- PDF, DOCX, and TXT extraction runs in the browser.
- Rule-based candidate matching runs locally.
- Derived candidate profiles, workflow stages, notes, filters, and preferences
  are stored in browser `localStorage`.
- The Express server is optional for the current workflow and exposes only
  service information and health endpoints.

## Local data

The application does not persist raw CV files. Candidate metadata remains tied
to the current browser profile. Clearing site data removes locally stored
profiles and preferences.

## Supported documents

- Text-based PDF files
- DOCX files using standard ZIP/XML compression
- Plain-text TXT files

Scanned PDFs require OCR and are reported as unsupported rather than producing
invented analysis.

## Quality commands

The package defines development, lint, build, and start scripts in
`package.json`. Run them only when appropriate for your environment.
