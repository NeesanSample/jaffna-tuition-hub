# Jaffna Tuition Hub

React / TypeScript / Vite Phase 1–3 frontend. Fictional Jaffna data, browser-local persistence, responsive indigo workspace, Tailwind v4 and a locally owned shadcn/ui-style Button composed with Radix Slot and class-variance-authority. React Router handles navigation, Lucide supplies icons, Recharts supplies enrolment charts, and qrcode.react generates real QR codes.

## Run

Node 24 recommended (repository tests use Node's built-in TypeScript stripping).

- `npm install`
- `npm run dev` — open the printed local URL
- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run preview` — inspect production output

## Demo access

- Platform admin: access all centres, create/edit/delete centres and branches, register students.
- Centre admin: select a centre at login; edit that centre, manage its branches and register its students.
- Branch staff: select a centre and branch; view only that branch and register students there. Location management is read-only.

Sign out to change roles or workspaces. Sessions deliberately return to the demo login on reload. Student profiles use `/students/:id`, and direct-ID requests are checked in the repository. Dashboard totals, filters and charts use only accessible records.

## Workflows

Centre/branch cards provide create/edit/delete with contact validation and deletion confirmation. A centre with related branches or students and a branch with students cannot be deleted. Complete student removal/transfer is outside Phase 1; populated branches remain protected.

Student registration has personal/guardian details, branch and grade selection, then review. Search by name/ID and combine branch/grade filters. Profiles include guardian contact information and a printable identity card. QR payloads include student, centre and branch IDs, without guardian phone details; they are identifiers rather than authenticated credentials.

## Architecture and persistence

- `src/domain/entities.ts`: typed entities and session scope.
- `src/repositories/mockRepository.ts`: asynchronous Repository contract and localStorage adapter. Replace the adapter with HTTP calls for a future backend.
- `src/repositories/seed.ts`: fictional seed records.
- `src/repositories/migrate.ts`: one-time migration of original prototype storage.
- `src/features/auth`, `dashboard`, `locations`, `students`: feature screens.
- `src/components/ui/button.tsx`: shared shadcn composition pattern, variants, keyboard focus, disabled states and link composition.

Data uses `jth-database-v1`. Existing `jth-centres`, `jth-branches`, and `jth-students` are retained. As the old prototype did not store ownership, imported branches/students belong to its first centre. Review this assignment and update imported location contact details before demonstrating tenant scope. Do not clear storage unless you intend to discard demo changes. Malformed data is reported instead of silently overwritten.

Demo selection exposes centre/branch names so users can choose a workspace; contact and student data require scoped repository methods. Browser role selection and localStorage are a frontend simulation, not production authentication or a security boundary. Real server-side authorization is required before using real student information. No backend, Kafka, Postgres or AI integration is included.

## Checks

Repository integration tests cover cross-tenant and branch rejection, direct-ID access, forged ownership, centre/branch CRUD, dependent-record deletion, registration validation, ID uniqueness, persistence, corrupt storage, failed writes and legacy migration. The modernization was browser-verified in Chrome across navigation, location CRUD, student registration/profile, role visibility, responsive breakpoints and both themes. See outputs/UI_MODERNIZATION_REPORT.md for scope and limitations.

## UI modernization

The interface now shares indigo/violet/neutral tokens in `src/App.css` for both light and dark modes. Theme (`jth-theme`) and desktop sidebar preference (`jth-sidebar`) use separate localStorage entries; business data keys and repository access checks are unchanged. Inter is requested from Google Fonts with a local system-font fallback.

The app shell includes breadcrumbs, centre/branch context, scoped global record search, recent-registration notifications, a theme switch, account sign-out, a collapsible desktop sidebar and a mobile drawer. New controls are functional. Notifications represent recorded student registrations, not a separate backend notification service. Dashboard month comparisons are calculated from recorded registration timestamps.

Centre/branch management uses searchable location cards, keyboard-friendly action menus, native modal dialogs and guarded deletion confirmations. Student registration uses a three-step dialog with inline validation; the student table supports combined filters, sorting and pagination. Profiles show guardian/enrolment details alongside a reusable QR identity card. Print / save PDF invokes the browser print dialog; saving a PDF is a browser action, not an automatic download.

Reusable UI components live in `src/components/shared`, `src/components/layout`, and `src/components/ui`; theme/toast providers live in `src/contexts`. Native `<dialog>` supplies focus containment and Escape handling without additional dependencies. Animations respect reduced-motion preferences. Tables deliberately scroll within their own container on small screens.


# Phase 2: classes, attendance and fees

Phase 2 adds four screens in the sidebar:

1. **Teaching setup** — manage tenant-specific subjects and teachers. Assigned records cannot be deleted.
2. **Classes** — create/edit/delete classes with branch, subject, teacher, grade, weekly day/time, capacity and monthly fee. Enrol matching-grade students from the same branch. Duplicate or over-capacity enrolments are rejected. An enrolment may be removed only before attendance or invoice history exists.
3. **Attendance** — choose a class and session date, mark individual students or bulk-mark present, then save. Unmarked is explicit, not counted as absent. Present, absent, late and excused can be corrected. Switching class/date requires saving or discarding edits. Students appear only on/after their joining date.
4. **Fees & receipts** — select class/month and generate one invoice per eligible enrolled student. Repeated generation skips existing invoices. Record partial/full payments using Cash or Bank transfer and view a printable receipt. Overpayments are rejected. Monetary values use integer cents; existing invoice amounts remain unchanged when class fees change.

## Phase 2 persistence and access

`jth-operations-v1` is a separate versioned storage key. Phase 1 records and storage schema are preserved. The first visit seeds one fictional teacher/subject per centre and one Grade 10 class per existing branch; class enrolments, attendance and invoices begin empty. Newly created branches do not receive automatic classes. Adding new centres requires teaching setup before creating classes.

Platform and centre administrators manage teaching setup and classes within their scope. Branch staff can view their branch's classes, enrol students, mark attendance, generate invoices and record mock collections, but cannot change teaching setup or class definitions. All operations, including direct-ID writes, verify scope through the Phase 1 repository. The sidebar remains role-independent for discoverability; the repository and controls enforce permissions.

The async adapter is `src/repositories/operationsRepository.ts`, with types and currency/date helpers in `src/domain/operations.ts`. Operations are serialized per repository instance to prevent overlapping requests from losing payments. This is a single-browser mock; cross-tab transactional locking requires a future backend. Phase 1 centre/branch deletion now also protects dependent Phase 2 records.

## Phase 2 limits

- Monthly invoices are generated manually for the whole class. There is no automatic billing, proration, discounts, refund/reversal, bank integration, tax accounting or real payment processing.
- Phase 3 extends weekly scheduling with teacher, classroom and student conflict checks; holiday calendars remain future work.
- Enrolment removal after attendance/invoicing is intentionally blocked to preserve history. Transfer, withdrawal and archive workflows are future work.
- New classes and enrolments use their actual creation/joining dates. Historic attendance before enrolment is rejected. Attendance dates cannot be in the future; payments cannot predate invoice creation or be future-dated.
- Receipt PDF saving uses the browser's print dialog. Receipt rendering was verified; native print output was not inspected because native computer-use access timed out.

Run `npm test` for Phase 1 and Phase 2 repository integration checks, and `npm run build` / `npm run lint` for source checks.

# Phase 3: academic management, scheduling and QR attendance

Phase 3 extends the existing records and routes. A batch is the existing `TuitionClass`; a student, branch, enrolment and student QR identity keep their original models and IDs.

## Academic setup

Teaching setup now manages subjects, teachers and grades. Grade 6–9 are labelled Secondary, Grade 10–11 O/L, and Grade 12–13 A/L. Subject applicability is configured by grade. Teachers have explicit subject and branch assignments. Batches can only use a teacher assigned to their branch and subject, and a subject that supports their grade. Records in use cannot be removed or renamed in a way that invalidates existing students or batches.

Student registration and filtering now include Grades 12 and 13. The wizard uses the selected centre’s configured grades. Student profiles list their enrolled batches and link to the existing enrolment dialog.

## Batches and weekly timetable

`/classes` supports classroom, duration and late-arrival grace, with live schedule checks. `/timetable` shows the weekly schedule filtered by branch and teacher, with details and an enrolment shortcut.

The repository rejects overlapping teacher assignments (including across branches in a centre), overlapping use of a classroom within the same branch, and overlapping batches for the same student. Adjacent sessions are allowed. Grade and branch matching, duplicate enrolment prevention and capacity limits remain in force. Students can join multiple matching-grade batches in their registered branch if times do not overlap.

All academic session times use Asia/Colombo. Classrooms are labels within an existing branch, rather than duplicate branch/location records. There is no separate room-capacity or travel-time model.

## QR and manual attendance

Open Attendance / QR, select the batch and today’s Sri Lanka date, then use QR check-in. Input options are camera, a QR image (maximum 10 MB), and scanner/pasted QR JSON or student ID. Camera and image decoding use `@zxing/browser` locally; no media is uploaded. Camera access requires HTTPS or localhost and normal user browser permission.

The existing student card JSON is accepted unchanged. Legacy student-ID-only identities are also accepted. If the QR includes centre and branch metadata, those values must agree with the stored student. The student must be enrolled in the selected batch and belong to its branch. QR check-in opens 30 minutes before the weekly session starts, ends at the scheduled finish, and uses the configured lateness grace. Duplicate Present/Late scans do not create another record or audit entry. Absent/Excused records require a manual correction instead of being overwritten by a scan.

Manual attendance retains Present, Absent, Late, Excused and explicit Unmarked states, including extra-session dates. Changes to a previously recorded register require a correction reason of at least five characters. Initial marks, QR entries, changes and clearing marks append an audit record containing old/new status, source, selected demo role, reason and timestamp. No historical audit entries are invented for pre-upgrade attendance. The audit is append-only through the repository API; browser storage remains editable in this frontend demo.

## Reports

`/attendance/reports` provides date, branch, teacher and batch filters; grouped charts and tables; a paginated audit trail; and CSV export. Ranges are limited to 93 days and end today or earlier. Presence rate is `(Present + Late) / (Present + Late + Absent)`. Excused and Unmarked do not count as absent or lower that recorded rate; their separate counts remain visible. Expected records derive from the current weekly timetable plus recorded extra sessions and eligible joining dates. There is no holiday calendar or historical timetable versioning. CSV cells are quoted and formula-like text is neutralized.

## Backward-compatible upgrade

The existing `jth-operations-v1` key gains `academicRevision: 1`, grades and an audit array. Existing student/class/enrolment/attendance/invoice/payment IDs and amounts are preserved. Legacy batches default to Room 1, 90 minutes and a 10-minute lateness grace. Legacy teachers initially receive their centre’s existing branches and subjects so Phase 2 assignments remain usable. Review these inferred assignments and classrooms; genuine conflicts in old schedules are shown instead of silently changing them.

Phase 1 location deletion also protects teacher branch assignments and academic grades. Original fee invoices, payments and receipts continue through the same repository. No backend, Kafka, PostgreSQL or new authenticated role model has been added.

## Test the complete flow

1. Run `npm install`, `npm run dev`, and sign in as a centre administrator.
2. In Teaching setup, review grades; add an A/L subject for Grades 12–13 and assign its teacher to an existing branch.
3. Create a batch with a classroom, duration and fee. Attempt to overlap a teacher or room: a conflict should appear and saving should be blocked.
4. Register a matching-grade student, then enrol them in two non-overlapping batches. Duplicate, capacity, branch/grade and timetable conflicts should be rejected.
5. For live QR testing, use a batch whose scheduled day/time includes the current Sri Lanka time; enrol an existing student and open their existing QR identity card.
6. Upload the QR image, use the camera after granting permission, or paste its JSON/ID into QR check-in. The first scan records Present/Late; repeating it reports an existing check-in without adding a record.
7. Change the saved status manually. Saving must remain disabled without a valid reason. Save with a reason and inspect Attendance reports: both QR and correction entries should appear.
8. Filter by branch, teacher or batch and group results. Export CSV and inspect the result. Sign in as branch staff and verify other branches cannot be accessed.
9. Reload and verify records persist; check the Phase 2 fee workflow still works.

Automated checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. The suite covers legacy records, financial preservation, access checks, O/L/A/L enrolment, conflicts, QR timing/duplicates, audit corrections, report denominators, CSV safety, and decoding an actual QR generated by the existing student card encoder.


# VCM Jaffna frontend pilot

The main URL now opens the focused VCM Maths demo. The original Jaffna Tuition Hub remains available at `/hub`, using its original saved data. No migration or reset of Hub records is performed.

Run `npm install` then `npm run dev`. Sign in with `teacher` or `reception` and the published demo password `vcm-demo`. This is simulated login for fictional data; it does not secure real information. Demo sessions expire after eight hours. VCM changes are saved in `vcm-pilot-v1` in this browser only.

The VCM workspace provides staff-managed Grade 12/13 registration, VCM numbers, optional family contacts, Maths batches with multiple weekly times, session-based attendance and revocable QR cards, partial monthly payments, receipts, admin discounts/voids, reports and settings. No student/parent portal, backend or database is implemented.

See `outputs/VCM_PILOT_REPORT.md` for completed screens, limits and manual testing, and `outputs/VCM_FUTURE_DATA_DESIGN.md` for the later backend design. `npm test` runs both the Hub and VCM suites. Also run `npm run typecheck`, `npm run lint` and `npm run build`.
