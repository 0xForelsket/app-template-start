# Factory App Ideas

A collection of app ideas for manufacturing/factory settings that can be built from this template.

---

## Workforce & People Apps

### Training & Certification Tracker
Track employee skills, certifications, and training records.
- **Core entities:** Skills, Certifications, TrainingRecords, Employees
- **Key features:**
  - Skill matrix (employee × skill grid)
  - Certification expiration tracking
  - Training session logging
  - Compliance reporting
  - Gap analysis (who needs what training)
- **Permissions:** `training:view`, `training:create`, `certification:manage`
- **Complexity:** Medium

### Safety Incident Reporter
Log and track safety incidents, near-misses, and corrective actions.
- **Core entities:** Incidents, NearMisses, CorrectiveActions, Investigations
- **Key features:**
  - Quick incident capture from floor
  - Photo attachments
  - Investigation workflow
  - OSHA recordkeeping
  - Trend analysis by area/type
- **Permissions:** `incident:report`, `incident:investigate`, `incident:close`
- **Complexity:** Medium

### Digital Shift Handoff
Structured communication between shifts.
- **Core entities:** ShiftLogs, Notes, Issues, Acknowledgments
- **Key features:**
  - Shift-to-shift notes
  - Open issues carry forward
  - Read acknowledgments
  - Area/line specific logs
  - Searchable history
- **Permissions:** `shift:write`, `shift:acknowledge`
- **Complexity:** Low

### Time & Attendance
Clock in/out with PIN authentication.
- **Core entities:** TimeEntries, Shifts, Schedules, OvertimeRequests
- **Key features:**
  - PIN-based clock in/out (template already has PIN auth!)
  - Shift scheduling
  - Overtime tracking
  - PTO requests
  - Manager approvals
- **Permissions:** `time:clock`, `time:approve`, `schedule:manage`
- **Complexity:** Medium

---

## Quality & Compliance Apps

### Quality Inspection App
Checklists, NCRs, and inspection records.
- **Core entities:** Inspections, Checklists, NonConformances, Dispositions
- **Key features:**
  - Configurable checklists
  - Pass/fail/NA responses
  - Photo evidence
  - NCR creation from failed inspections
  - First article inspection support
- **Permissions:** `inspection:perform`, `ncr:create`, `ncr:disposition`
- **Complexity:** Medium-High

### 5S / Lean Audit Tool
Area audits with scoring and photos.
- **Core entities:** Audits, Areas, Scores, ActionItems
- **Key features:**
  - Mobile-friendly audit forms
  - Photo capture
  - Scoring (1-5 per category)
  - Trend charts over time
  - Action item tracking
- **Permissions:** `audit:perform`, `audit:view_all`
- **Complexity:** Low-Medium

### Document Control System
SOPs, work instructions, version control.
- **Core entities:** Documents, Versions, Acknowledgments, Reviews
- **Key features:**
  - Version control
  - Review/approval workflow
  - Read acknowledgment tracking
  - Linked to training requirements
  - Obsolete document management
- **Permissions:** `document:create`, `document:approve`, `document:acknowledge`
- **Complexity:** Medium

### Calibration Tracker
Instrument and gauge management.
- **Core entities:** Instruments, CalibrationRecords, Certificates, Schedules
- **Key features:**
  - Instrument registry
  - Due date tracking
  - Certificate storage
  - Out-of-tolerance handling
  - Recall notifications
- **Permissions:** `calibration:view`, `calibration:perform`, `instrument:manage`
- **Complexity:** Medium

---

## Problem Solving Apps

### Problem Solver (8D/A3/5 Whys)
Structured problem-solving workflow.
- **Core entities:** Problems, Investigations, RootCauses, CorrectiveActions, Verifications
- **Key features:**
  - Guided 5 Whys builder
  - Containment → Investigation → Action → Verification workflow
  - Team assignment
  - Action tracking with due dates
  - Effectiveness verification
  - Customer 8D export
- **Permissions:** `problem:create`, `problem:investigate`, `problem:close`
- **Complexity:** High
- **High value:** Audit compliance, knowledge retention, prevents repeat issues

### Suggestion Box / Kaizen Tracker
Employee improvement ideas.
- **Core entities:** Suggestions, Votes, Implementations, Savings
- **Key features:**
  - Idea submission
  - Voting/prioritization
  - Implementation tracking
  - Savings calculation
  - Recognition program integration
- **Permissions:** `suggestion:submit`, `suggestion:review`, `suggestion:implement`
- **Complexity:** Low-Medium

---

## Equipment & Tools Apps

### Tool Crib / Checkout System
Tool accountability and tracking.
- **Core entities:** Tools, Checkouts, Returns, Locations
- **Key features:**
  - Checkout/return with employee PIN
  - Who has what
  - Overdue notifications
  - Tool location tracking
  - Consumables inventory
- **Permissions:** `tool:checkout`, `tool:manage`
- **Complexity:** Low-Medium

### Equipment Logbook
Per-machine notes and tribal knowledge.
- **Core entities:** Machines, LogEntries, Tips, Issues
- **Key features:**
  - Machine-specific notes
  - Troubleshooting tips
  - Issue history
  - Searchable knowledge base
  - Operator contributions
- **Permissions:** `logbook:write`, `logbook:view`
- **Complexity:** Low

### Spare Parts Tracker
Simple inventory for critical spares.
- **Core entities:** Parts, Locations, Transactions, ReorderPoints
- **Key features:**
  - Min/max levels
  - Reorder alerts
  - Transaction history
  - Location tracking
  - Simpler than full CMMS inventory
- **Permissions:** `parts:view`, `parts:transact`, `parts:manage`
- **Complexity:** Medium

---

## Production Apps

### Production Counter
Simple job/batch tracking.
- **Core entities:** Jobs, Counts, Cycles, Downtime
- **Key features:**
  - Job start/stop
  - Count entry
  - Cycle time recording
  - Simple downtime logging
  - Shift summaries
- **Permissions:** `production:log`, `production:view_all`
- **Complexity:** Low-Medium

### Downtime Logger
Track and categorize downtime events.
- **Core entities:** DowntimeEvents, ReasonCodes, Machines
- **Key features:**
  - Quick reason code selection
  - Duration tracking
  - Pareto analysis
  - Trend reporting
  - Machine-specific history
- **Permissions:** `downtime:log`, `downtime:analyze`
- **Complexity:** Low

### Kanban Signal Board
Visual reorder signals.
- **Core entities:** Signals, Parts, Suppliers, Statuses
- **Key features:**
  - Visual card board
  - Status tracking (empty → ordered → received)
  - Supplier notifications
  - History/velocity tracking
- **Permissions:** `kanban:signal`, `kanban:fulfill`
- **Complexity:** Low

---

## App Combinations

Some apps work well together:

### Training + Problem Solving
- Problem root cause → training gap identified
- Training completed → closes corrective action
- Shared employee records

### Quality + Problem Solving
- Failed inspection → triggers problem record
- NCR disposition → corrective action tracking
- Linked evidence and history

### Safety + Training
- Incident → training requirement triggered
- Certification tracking for safety-critical roles
- Compliance dashboard

---

## Choosing Your First App

| If you want... | Build this |
|----------------|------------|
| Quick win, low complexity | Shift Handoff, Downtime Logger |
| High compliance value | Training Tracker, Safety Incident |
| Most reuse of template patterns | Tool Crib (clear CRUD, checkout flow) |
| Highest long-term value | Problem Solver (prevents repeat issues) |
| Employee engagement | Suggestion Box |

---

## Template Fit

All these apps work well with the template because they need:
- **PIN auth** - Factory floor terminals, shared devices
- **Role-based permissions** - Operators vs supervisors vs admins
- **Mobile-friendly** - Tablets on the floor
- **Audit trails** - Compliance and accountability
- **Simple CRUD** - Create, view, update entities
- **Status workflows** - Open → In Progress → Closed patterns
