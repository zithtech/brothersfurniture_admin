# Brothers Furniture — Admin Management Portal

A dedicated, full-featured Admin Application built for **Brothers Furniture** (Ambattur, Chennai), tailored directly from analyzing the landing application (`brothersfurniture_UI`).

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailored design system with bespoke CSS tokens & Tailwind v4
- **Icons**: Lucide Icons
- **Persistence**: LocalStorage with state backup, restore, and TypeScript code export

## Key Modules & Capabilities

1. **Executive Dashboard (Command Center)**:
   - High-level KPIs: Active Sales Pipeline (₹ Lakhs), Confirmed B2B Orders, Inventory Catalog Count, Corporate Client Roster.
   - Ambattur Plant operational status badge with live dispatch health.
   - Monthly quotation and contract volume trend charts.
   - Category distribution breakdown across all 6 furniture lines.
   - Rapid administrative action launcher.

2. **Products & Inventory Manager**:
   - Manage commercial products across all 6 categories: *Workstations, Office Chairs, Desks, Meeting Tables, Storage, Lounge*.
   - Filter by Category, Stock status (In Stock / Out of Stock), and Search keywords.
   - Switch between high-density Table View and visual Card Grid View.
   - Quick one-click inline In-Stock toggle and Homepage Featured star toggle.
   - Add & Edit modal with photo previews, dimensions, material descriptions, and pricing calculations.

3. **Ergonomic Chairs Dedicated Catalog**:
   - Specialised management view for the 20+ Ambattur factory manufactured models (*Godrez HB, Grandeur HB, Haux HB, Optimus Elite, Twister HB, Butterfly, etc.*).
   - Filter by Chair Type: *High Back, Medium Back, Mesh Seat, Visitor / Cantilever*.
   - Assembly line production toggle (`In Production` / `Paused`).

4. **Inquiries & Leads CRM**:
   - Manages incoming lead submissions from the landing site contact form (*Send Us a Message* and *Bulk Quote requests*).
   - Visual Kanban Board pipeline stages: `New Inquiries` → `Contacted` → `Quote Sent` → `Site Visit / CAD` → `Deals Won` → `Lost`.
   - One-click WhatsApp responder with pre-filled message template.
   - Direct phone call links, follow-up notes editor, and one-click "Convert Lead to Order".

5. **Orders & Quotations**:
   - B2B commercial purchase orders and quote tracker with line-item breakdowns.
   - Status tracking stepper (`Pending Review` → `In Factory Production` → `Ready for Dispatch` → `Out for Installation` → `Installed & Completed`).
   - Printable Pro-Forma Invoice modal with official company letterhead, GSTIN, bill-to, and terms.

6. **Corporate Partners Showcase**:
   - Manage marquee clients (*PVR Cinemas, Indian Bank, Billroth Hospital, Nibav Lifts, etc.*) with sector badges and logo previews.

7. **Customer Reviews & Testimonials**:
   - 5-star review management with approval and homepage featured switches.

8. **Factory & Store Settings**:
   - Ambattur plant address, Google Maps embed & CID, primary & secondary phone numbers, GSTIN, free shipping thresholds, and landing page announcement banner.

9. **Data Sync & Export**:
   - Generates exact TypeScript code for `brothersfurniture_UI/src/data/products.ts` and `brothersfurniture_UI/src/data/company.ts`.
   - One-click JSON backup export and restore.
   - Reset to factory default seed data.

## Running the Application Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build for production
npm run build
```
