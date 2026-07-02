# **📝 PRODUCT REQUIREMENT DOCUMENT (PRD)**

## **Project Title: Ciudad Verde Calamba HOA Portal**

**Target Deployment Platform:** Vercel (Frontend)

**Target Backend Platform:** Supabase (Database, Auth, Storage)

**Stack Constraints:** 100% Free Tiers (Next.js App Router, Tailwind CSS, shadcn/ui, Resend, GitHub Actions)

## **1\. Executive Summary & Core Objective**

The Ciudad Verde Calamba HOA Portal is a secure, role-based web application serving as the official digital hub for the homeowners association. The application splits cleanly into a public-facing informational frontend and a restricted, role-authenticated backend management system. Security, tracking auditability, and absolute adherence to strict data validation are paramount.

## **2\. User Roles & Access Matrix (RBAC)**

The system operates on an immutable hierarchy of six distinct authorization tiers:

| Role | Access Level | Description & Core Capabilities |
| :---- | :---- | :---- |
| **System Admin (Owner)** | sys\_admin | Global override. System initialization. Approves/denies President account. Can activate/deactivate *any* user profile. Full database visibility. |
| **President** | president | Executive Management. Approves/denies registrations for tiers below them. Assigns roles. Approves/publishes documents. Can activate/deactivate users (except sys\_admin and other president accounts). |
| **Vice President** | vice\_president | Operational Backup. Inherent approval permissions matching the President *except* for account management. **Forbidden** from activating, deactivating, or deleting any member accounts. |
| **Document Controller** | doc\_controller | Content Ingestion. Uploads draft notices, announcements, and minutes of meetings. Cannot bypass approval to publish live. |
| **Board Member** | board\_member | Premium Consumer. Can view all published Notices, Public Announcements, and private Board Minutes of Meetings. |
| **Regular Member** | regular\_member | Standard Consumer. Verified homeowner. Can view published Notices and Public Announcements. **Forbidden** from viewing Board Minutes of Meetings. |

## **3\. Technical Stack Architecture**

* **Frontend Framework:** Next.js 14+ (App Router) using TypeScript.  
* **Styling & UI:** Tailwind CSS \+ shadcn/ui components (built on Radix UI primitives).  
* **Database & Auth Engine:** Supabase PostgreSQL with strict Row Level Security (RLS) policies.  
* **Storage Bucket:** Supabase Storage (Private and Public buckets with custom access policies).  
* **Transactional Mailer:** Resend API (Free Tier) integrated through Next.js API Routes.  
* **Keep-Alive Daemon:** GitHub Actions automated cron job pinging the REST API every 48 hours to bypass Supabase Free Tier project pausing.

## **4\. Functional Specifications & Workflows**

### **4.1 Onboarding & Registration (The Gatekeeper Engine)**

1. **Public Sign-up Form:** Requires Email, Password, First Name, Last Name, Phase, Block, and Lot Number.  
2. **Registration State:** Upon submission, the account is created in Supabase Auth but initialized in a pending\_approval state within the public profiles metadata table. The user *cannot* log into the private dashboard.  
3. **Notification Pipeline:** A trigger hits the Next.js API route via Resend, delivering a transactional notification to the President and Vice President.  
4. **Email Payload:** The email contains metadata (Applicant Name, Phase/Block/Lot) and a secure deep-link button mapping straight to /dashboard/admin/approvals.  
5. **Admin Review Panel:** The President or VP authenticates, navigates to the approval panel, reviews the Phase/Block/Lot, and clicks **Approve** or **Deny**. If approved, a dropdown selector assigns their specific user role (regular\_member, board\_member, etc.).  
6. **First Account Bootstrap Exception:** The System Admin account will be manually seeded via SQL Editor or custom initial setup logic to break the "chicken-and-egg" loop. The System Admin manually approves the first incoming President account.

### **4.2 Document Management & Traceability Workflow**

1. **Ingestion:** The Document Controller or President uploads a file through a unified portal dashboard form.  
2. **Fields Required:** Title, Category Selector (Notice, Announcement, Minutes of Meeting).  
3. **File Constraints:** Frontend and Backend validation filters enforce file type isolation matching strictly: application/pdf, .docx, .png, .jpg. Max size: 10MB.  
4. **Tracking Auto-Generation:** Document IDs are generated chronologically by a database database-level sequence.  
   * *Format Example:* CV-NOTICE-2026-001, CV-MOM-2026-005.  
5. **Staging State:** Uploaded files enter a pending\_review status. They are strictly invisible to standard members.  
6. **Approval Step:** The President or VP reviews the document metadata and files within their internal queue and toggles is\_published \= true.  
7. **Broadcast Opt-in Toggle:** The upload form features a mandatory boolean checkbox: \[ \] Send email notification to members upon approval.  
   * If **Checked**: Publishing triggers a background batch call to Resend processing alerts to all active members mapped to that document type's visibility rules.  
   * If **Unchecked**: The document goes live on the portal completely silently.

### **4.3 Deep Linking & Session Resilience**

* **Problem Space:** Expired sessions dump users clicking email notices onto a generic landing page, killing user context.  
* **Resolution Specification:** All notification emails must structuralize direct link structures format: /login?redirectTo=/dashboard/documents/\[DOCUMENT\_ID\].  
* **Frontend Guard:** The Next.js custom middleware must cache the redirectTo string query parameter, authenticate the user, and immediately shift the window push state directly to that target route upon a validation payload from Supabase Auth.

### **4.4 Account Lifecycle Management (Moving Out/Deactivation)**

* **Operational Control:** Deleting data ruins audit logs. When a homeowner moves away, their record must be retained.  
* **Implementation:** The UI exposes a "Deactivate Account" option strictly bounded by user identity security checks.  
* **Access Barriers:** Only the sys\_admin or president can execute an account status shift (status \= 'deactivated'). If a user's database row reflects a deactivated state, the Next.js Middleware instantly terminates active sessions and blocks new handshakes.

## **5\. Database Schema Blueprint (Supabase SQL)**

Claude Code should apply the exact structural database layout using this Postgres code snippet inside the Supabase instance:

SQL  
\-- Enable UUID extension  
create extension if not exists "uuid-ossp";

\-- Create Custom Enum Tiers for RBAC  
create type user\_role\_tier as enum ('sys\_admin', 'president', 'vice\_president', 'doc\_controller', 'board\_member', 'regular\_member');  
create type account\_status\_tier as enum ('pending\_approval', 'active', 'deactivated');  
create type doc\_category\_tier as enum ('Notice', 'Announcement', 'Minutes of Meeting');

\-- Profiles Table linked to Supabase Auth Users  
create table public.profiles (  
  id uuid references auth.users on delete cascade primary key,  
  first\_name text not null,  
  last\_name text not null,  
  phase text not null,  
  block text not null,  
  lot text not null,  
  role user\_role\_tier default 'regular\_member'::user\_role\_tier,  
  status account\_status\_tier default 'pending\_approval'::account\_status\_tier,  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null,  
  updated\_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

\-- Document Sequences for Traceability Tracking IDs  
create sequence if not exists document\_seq\_notice start with 1;  
create sequence if not exists document\_seq\_announcement start with 1;  
create sequence if not exists document\_seq\_mom start with 1;

\-- Master Document Table  
create table public.documents (  
  id uuid default gen\_random\_uuid() primary key,  
  tracking\_number text unique not null,  
  title text not null,  
  category doc\_category\_tier not null,  
  storage\_url text not null,  
  uploaded\_by uuid references public.profiles(id) not null,  
  is\_published boolean default false not null,  
  created\_at timestamp with time zone default timezone('utc'::text, now()) not null,  
  published\_at timestamp with time zone  
);

\-- Row Level Security (RLS) Policy Initializations  
alter table public.profiles enable row level security;  
alter table public.documents enable row level security;

\-- EXAMPLE RLS POLICY: Document Visibility  
create policy "Published documents viewable by authorized roles" on public.documents  
  for select using (  
    is\_published \= true   
    and status \= 'active'  
    and (  
      (category in ('Notice', 'Announcement')) or  
      (category \= 'Minutes of Meeting' and auth.uid() in (select id from public.profiles where role in ('sys\_admin', 'president', 'vice\_president', 'board\_member')))  
    )  
  );

### **Automated Unique Tracking Number Trigger**

Claude Code must generate a database function trigger parsing formatting parameters automatically on insertion:

SQL  
create or replace function public.generate\_tracking\_number()  
returns trigger as $$  
declare  
  seq\_val int;  
  prefix text;  
  year\_val text;  
begin  
  year\_val := to\_char(now(), 'YYYY');  
  if NEW.category \= 'Notice' then  
    seq\_val := nextval('document\_seq\_notice');  
    prefix := 'CV-NOTICE-';  
  elsif NEW.category \= 'Announcement' then  
    seq\_val := nextval('document\_seq\_announcement');  
    prefix := 'CV-ANNC-';  
  else  
    seq\_val := nextval('document\_seq\_mom');  
    prefix := 'CV-MOM-';  
  end if;  
    
  NEW.tracking\_number := prefix || year\_val || '-' || lpad(seq\_val::text, 3, '0');  
  return NEW;  
end;  
$$ language plpgsql;

create trigger tr\_documents\_tracking\_id  
  before insert on public.documents  
  for each row execute function public.generate\_tracking\_number();

## **6\. Frontend Routing & UI Layout Map**

Plaintext  
src/  
├── app/  
│   ├── (public)/                 \# No Auth Required Layer  
│   │   ├── page.tsx              \# Hero Section, About Us, Mission & Vision statements  
│   │   └── login/page.tsx        \# Login / Sign-up Forms with deep linking handling  
│   ├── dashboard/                \# Main Layout Layer guarded by Authentication  
│   │   ├── page.tsx              \# Overview Switcher dashboard based on specific roles  
│   │   ├── documents/  
│   │   │   ├── page.tsx          \# Main file repository directory grid view  
│   │   │   └── \[id\]/page.tsx     \# Deep-linked target viewer frame for individual document row ids  
│   │   └── admin/                \# Restricted Sub-routes using RBAC check middleware  
│   │       ├── approvals/page.tsx \# Membership Application Management Queue  
│   │       ├── upload/page.tsx   \# Document uploader form with notification toggle UI  
│   │       └── members/page.tsx  \# User roster showing Activation / Deactivation toggles

## **7\. Step-by-Step Implementation Protocol for Claude Code**

When processing this build sequence inside your terminal, feed these explicit sequential phases to Claude Code:

### **Phase 1: Scaffolding & Dependency Set**

Initialize a Next.js App Router workspace utilizing Tailwind CSS. Install the Supabase JS library, Lucide React icons, and hook up shadcn UI components (Table, DropdownMenu, Dialog, Button, Input, Select, Checkbox).

### **Phase 2: Supabase Initialization & Database Seeding**

Execute the SQL DDL commands listed in Section 5 via the local configuration setup. Insert a single manual system admin baseline account to bypass initial system blockages. Set up custom private bucket permissions blocking public reads on Minutes of Meeting artifacts.

### **Phase 3: Middleware Foundations & Guardrail Engineering**

Write a Next.js edge middleware script parsing inbound user sessions against user meta roles fetched from public.profiles. If a profile read points to status \== 'deactivated' or status \== 'pending\_approval', clear the tokens and route back onto the public root immediately.

### **Phase 4: Business Logic Application UI & Mailing Actions**

Construct the complex forms matching operational targets exactly. Wire the Next.js API serverless function endpoints using the Resend library package to iterate loops across target communication arrays when automated notifications are dispatched out to the neighborhood.

### **Phase 5: Production Resiliency Sweeps**

Embed file type validation checks within frontend input change hooks and wrap background transaction actions inside database isolation blocks to guarantee that concurrent uploads never produce race conditions. Build the .github/workflows/keep-alive.yml config template to complete system readiness.

