# CC Design Patterns

TypeScript examples of common design patterns.

## Setup

```bash
npm install
```

## Files

### `approve_request.ts`

**Task:** Multi-level expense approval (Team Lead → Manager → Director).

**Design pattern:** Chain of Responsibility

**Code overview:**
- `ApproveRequest` holds a name, min approval amount, and optional `nextApprover`
- `setNext()` links handlers into a chain
- `approve(amount)` either approves at the current level or forwards to the next handler

---

### `log.ts`

**Task:** Send log messages to different destinations (console, file, database) filtered by level.

**Design patterns:** Factory, Strategy / Template Method

**Code overview:**
- `LogLevel` / `LogMessage` define severity and payload
- `BaseLogSink` filters by allowed levels, then calls abstract `write()`
- `ConsoleLogSink`, `FileLogSink`, `DatabaseLogSink` implement each destination
- `LogSinkFactory` builds sinks from config; `LoggerManager` registers sinks and fans out each log call

---

### `support_ticket.ts`

**Task:** Create support tickets, assign agents, and notify customers when status changes.

**Design patterns:** Factory, Observer, Strategy

**Code overview:**
- `TicketFactory` creates `TechnicalTicket`, `BillingTicket`, or `GeneralTicket`
- Status transitions: `open` → `in_progress` → `resolved` (invalid ones throw)
- Observers (`EmailNotifier`, `SmsNotifier`, `ConsoleNotifier`) get notified on status change
- Assignment strategies: `PriorityAssignment` (skill + seniority) and `RoundRobinAssignment`
- `TicketService` wires factory, observers, and strategy together; includes a small test harness

---

### `Email_Service/index.ts`

**Task:** Send different kinds of email (transactional, non-transactional, subscription) via nodemailer.

**Design patterns:** Strategy, Factory / Registry

**Code overview:**
- `EmailService` base class sets up the Gmail transporter and shared `baseSendEmail()`
- Concrete classes (`transactionalEmails`, `nonTransactionalEmails`, `SubscriptionEmails`) implement `EmailServiceInterface`
- `emailObjectMap` picks the right sender by `EmailType`
- Uses env vars: `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TRANSACTIONAL_USER`
