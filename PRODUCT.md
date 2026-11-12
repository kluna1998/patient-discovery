# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Doctors reviewing a patient cohort to select candidates for a clinical trial.

## Product Purpose

Patient Discovery helps doctors review candidate records, decide which patients to accept or reject for the trial, and retain the reason for each decision in a CSV export.

## Operating Context

- A doctor opens a cohort CSV in the browser, then uses search, sorting, and column selection to work through pending records.
- The patient detail view groups fields using a column dictionary that provides readable labels, descriptions, and criterion information where available.
- The doctor records a reason when accepting or rejecting a candidate and can revise a decision during the session.
- The CSV export includes the cohort rows, review status, reason, and review timestamp. It can include records still pending.

## Capabilities and Constraints

- The current app is a proof of concept. It holds the cohort and decisions in browser memory. Reloading, closing the tab, or loading another cohort ends the current review session.
- Doctors retain their results by exporting the review. The app currently cannot restore a review from an export.
- A full-stack version is a possible future direction. Its scope and persistence model are open decisions.

## Brand Commitments

- The product name is Patient Discovery. The current interface is in Spanish.
- Preserve the Hospital Clinic (no UB) and IDIBAPS identities. The app uses `public/clinic-barcelona-reference.jpg` and `public/idibaps-logo.png`.

## Evidence on Hand

- `README.md` documents the review workflow in Spanish.
- `public/info_columns_dict.csv` contains the field dictionary used by the app.

## Product Principles

- Keep selection decisions with the doctor and make relevant patient fields easy to consult.
- Capture the rationale alongside each decision and include it in the export.
- Make pending work visible and let doctors export at any point in the session.
