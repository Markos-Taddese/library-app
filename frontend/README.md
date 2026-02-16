# Frontend

**Tagline:** The Single Page Application (SPA) for the Library Management System, providing a clean, responsive interface for catalog search, member management, and loan tracking.

---
## Context and Technology Stack

| Aspect | Details |
| :--- | :--- |
| **Technology Stack** | **React.js (18+), React Router DOM, Tailwind CSS,Axios** |
| **Data Protocol** | REST API (Communicates with backend API on `http://localhost:3000`) |
| **Primary Goal** | **Data Integrity UI:** Implement client-side logic to support the backend's transactional consistency. |

---
## Key Features & Responsibilities

* **Dashboard tracking:**  Real-time metrics for book inventory (total unique books, available copies), active members, active & overdue loans, and a detailed table of overdue members with complete contact information for easy follow-up.
* **Book Search:** Dynamic searching and real-time filtering against the complex backend bookcontroller.
* **Loan Operations:** Dedicated UI components for initiating loans, managing Active and Overdue loans, processing returns, and handling transactional renewals. 
  - **Silent Refresh Pattern:** Separate primary actions (Return/Renew) from UI refreshes using nested try/catch blocks. This ensures "Success" is reported even if a background refresh fails, warning the user of stale data instead of a total failure.
  - **Renewal Policy:** Renew button disabled immediately when a loan is overdue (0‑day grace), matching backend rules.
  - **Console Cleanliness:** Unhandled promise rejections during tab switches are caught and suppressed (using `.catch(() => {})`) to avoid noisy console warnings, without affecting user experience.
* **Data Integrity UI:** Implements client-side checks (e.g., verifying active member status) to improve user feedback before hitting transactional API endpoints.
* **Responsive Design:** Built using Tailwind CSS for a mobile-first user experience.
* **Dark Mode Toggle:** Theme preference is managed via React Context and a reusable `DarkModeToggle` component, applied using Tailwind's dark mode classes.
* **Error Handling:** Utilizes the **`useToast` hook** to present granular error messages derived directly from the API's status codes, with built-in fallbacks for network failures.
* **Data Consistency:** Complex API responses (normalized joins from the backend) are immediately **reshaped and normalized** into simple, UI-friendly JavaScript objects within the Page components.
* **Routing Architecture:** Uses React Router's nested routes with a persistent `<MainLayout />`. The layout stays mounted while page content swaps via `<Outlet />`, preventing unnecessary re‑renders and preserving UI state(persistent sidebar) .

---

## Structure and API Communication

| Directory | Type | Key Responsibility |
| :--- | :--- | :--- |
| **`/src/pages`** | **Page Containers (Views)** | **business logic**, state management, and implementation of complex features like search debouncing. |
| **`/src/components`** | Presentational | Reusable UI elements (`DataTable`, `FormModal`), focused on rendering, receiving data via props. Also contains **MainLayout** with persistent sidebar and **<Outlet />** for nested routing. |
| **`/src/services`** | **API Abstraction Layer** | All network communication. **Translates user actions** into API calls, handles payload formatting, and routes network errors. |
| **`/src/hooks`** | Custom Hooks | Reusable non-UI state logic for `useToast`, `useDarkMode`. |

---
---

## Setup and Configuration

This client requires the Backend API to be running on `http://localhost:3000`.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **API Configuration:**
    Create a **`.env`** file in this `frontend/` directory to define the API root:
    ```env
    VITE_API_BASE_URL=http://localhost:3000
    ```
3.  **Start Development Server:**
    ```bash
    npm run dev
    ```

---
