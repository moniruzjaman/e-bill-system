# SOP: UI and UX Design Standards

This document outlines the premium design standards for the Fertilizer Tracking E-Bill System to ensure a consistent, high-impact user experience across all modules.

## 1. Visual Aesthetics

- **Typography**: Primary font is 'Inter' from Google Fonts. Use weights 400 (regular), 600 (semibold), and 700 (bold).

- **Color Palette**:
  - Primary: `#1890ff` (Actionable elements)
  - Success: `#52c41a` (Completed, verified, profit)
  - Warning: `#fa8c16` (Pending, attention required)
  - Danger: `#f5222d` (Error, rejected, critical)
  - Background: `#f8fafc` (Main surface)

- **Glassmorphism**: Use `rgba(255, 255, 255, 0.9)` with `backdrop-filter: blur(10px)` for modal-like cards (e.g., login).

## 2. Interactive Elements

- **Buttons**:
  - `btn-primary`: Blue background, white text. Main action.
  - `btn-success`: Green background, white text. Positive completion.
  - `btn-outline`: Border only, background appears on hover. Secondary actions.

- **Micro-animations**: Use subtle fade-in transitions (`@keyframes fadeIn`) for tab switching and logins.

- **Charts**: Implementation using Chart.js. Maintain aspect ratios and use the theme-consistent colors.

## 3. Policy Alignment (UI Displays)

- **References**: Always display reference citations for "Learning from Asia Report" and specific page numbers when relevant to satisfy policy audits.

- **Blockchain Indicators**: Use the 'Blockchain Verified' badge with a checkmark for any data fetched from the API (verified by SHA-256 hash).

- **NUE Tracking**: Display the 50% target clearly with a progress bar and status indicator.

## 4. Multi-language Support

- Ensure all basic text follows the `translations` object in `e-bill-system.html`.

- Supported languages: English (en), Bengali (bn), Hindi (hi).

- Dynamic data from API should ideally be localized or handled gracefully.
