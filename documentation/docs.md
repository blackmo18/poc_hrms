## 💡 HR System Blueprint: What Does Each Section Do? (Updated)

This system is built around managing your organization and its people. Think of the database as a highly organized digital filing cabinet, where each main cabinet (**Section**) holds folders (**Tables**) for a specific function.

### 1. 🔑 The Foundation (Who You Are & Who Can Log In)

This section controls access and defines the main groups of users within your system.

| Folder Name | Simple Purpose | What It Holds | Key Connections |
| :--- | :--- | :--- | :--- |
| **Organization** | The main company file. Everything else belongs to this file. | Your company's name, address, and service status. | Links to ALL other data (Employees, Payrolls, Documents). |
| **User** | Your individual login credentials. | Your email, login password, and whether your account is active. | Links to your **Employee** profile and what **Roles** you have. |
| **Employee** | Your personal HR file. | Your name, contact details, start/end dates, and who your manager is. | Links to your **User** login, your **Department**, and all your **Payrolls**. |
| **Role & Permission** | The security guard. | Defines what actions you are allowed to perform (e.g., a "Manager" role can **Approve Leave**). | Links users to specific levels of access (like assigning a key). |

---

### 2. 🗂️ Structure, Onboarding, and Official Files

This section organizes your company hierarchy and manages all necessary paperwork and lifecycle processes.

| Folder Name | Simple Purpose | What It Holds | Key Connections |
| :--- | :--- | :--- | :--- |
| **Department** | Defines where you work (e.g., "Sales," "IT"). | The name and description of a team or division. | Links many **Employees** to one specific department. |
| **Job Title** | Defines your official position (e.g., "Analyst," "Director"). | The name and description of the role itself. | Links many **Employees** to one specific job type. |
| **Compensation** | Your salary history. | Your base pay rate, how often you are paid (monthly/weekly), and when that rate started. | Links to your **Employee** file. |
| **Document** | The library of official templates. | The standard contract or tax forms your company uses. | Used to track official templates that **Employee Documents** are based on. |
| **Employee Document** | Your specific signed documents. | A record confirming you signed a specific contract or received a policy handbook. | Links your **Employee** file to a specific signed **Document**. |
| **Onboarding/Offboarding** | The HR checklists. | Tracks the steps required when a new employee starts or when an employee leaves. | Links to your **Employee** file to manage the join/exit process. |

---

### 3. ⏰ Time, Leave, and Company Calendar

This section tracks work hours, time-off requests, and holiday schedules.

| Folder Name | Simple Purpose | What It Holds | Key Connections |
| :--- | :--- | :--- | :--- |
| **Timesheet** | Your daily clock-in/out records. | The date, your clock-in time, clock-out time, and total hours worked. | The primary data used to calculate payment in **Payroll**. |
| **Leave Request** | Your vacation or sick leave requests. | The type of leave, start date, end date, and current approval status. | Links to your **Employee** and usually requires manager approval. |
| **Holiday Template** | A group of standard holidays. | Defines the official holiday schedule (e.g., "Philippine National Holidays"). | Links to the **Organization** and generates individual **Holiday** records. |
| **Holiday** | A list of specific official holidays. | The specific dates for national holidays or company days off. | Used by **Payroll** and linked to **Calendar** and **Holiday Templates**. |
| **Calendar** | A working schedule definition. | Defines a specific working calendar (e.g., "Main Office Calendar," "Shift Team B Calendar"). | Links to the **Organization** and is used to group specific **Holidays**. |
| **Employee Holiday Assignment** | Custom holiday rules for an employee. | Tracks if an employee has a specific holiday assigned to them (used for overrides). | Links an **Employee** to a specific **Holiday**. |

---

### 4. 💸 Payroll, Money, and Benefits

This is the most critical section for your offshore HR team, as it manages all financial transactions and legal deductions.

| Folder Name | Simple Purpose | What It Holds | Key Connections |
| :--- | :--- | :--- | :--- |
| **Benefit** | The official list of benefits (e.g., SSS, PhilHealth, retirement plans). | The name and type of all benefits the company offers. | Links to the **Organization** and is used to link employees to specific benefit plans. |
| **Employee Benefit** | Your enrollment in a benefit. | Details on which benefit plan you are in and how much you contribute. | The financial data used to calculate **Deductions** in payroll. |
| **Payroll** | Your official pay slip. | The calculated pay period, your final gross pay, and your final net pay. | Receives data from **Timesheet**, **Compensation**, and **Deduction** tables. |
| **Deduction** | Line-by-line breakdown of money taken out. | Every tax, loan payment, or benefit contribution deducted from your gross pay. **This is critical for local compliance.** | Links directly to your processed **Payroll** record. |

---

### 5. 🛡️ Security and Accountability (The Offshore Team's Ledger)

This section is vital for your low-fee, offshore service model because it ensures **trust and accountability** by tracking every action taken by staff.

| Folder Name | Simple Purpose | What It Holds | Why It's Important |
| :--- | :--- | :--- | :--- |
| **Audit Log** | The system's **security and activity journal**. | A permanent record of who (which user, including your offshore HR staff), what, and when they changed data (e.g., "User X changed Employee Y's salary from $50k to $60k on 2025-11-27"). | **This proves to the client that your offshore staff are acting correctly and securely**, protecting you from disputes and compliance issues. |