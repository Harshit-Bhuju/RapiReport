# RapiReport Database

## Schema Source

**`backend/rapireport.sql`** is the canonical, full database dump. It contains:

- All tables (users, appointments, prescriptions, reports, consultation_calls, consultation_messages, chat_sessions, family_members, etc.)
- All columns including: `prescriptions.image_path`, `reports.image_path`, `consultation_messages.appointment_id`, `chat_messages.session_id`, `territory_users.yearly_super_points`
- Sample/seed data

## Setup

1. Create database: `CREATE DATABASE rapireport;`
2. Import: Run or import `backend/rapireport.sql`

## Updates

When schema changes are made, re-export the database to `rapireport.sql` (e.g. via phpMyAdmin Export) so it stays the source of truth.
