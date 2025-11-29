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

* **Book Search:** Dynamic searching and filtering against the complex backend bookcontroller.
* **Loan Operations:** Dedicated UI components for initiating loans, processing returns, and handling transactional renewals.
* **Data Integrity UI:** Implements client-side checks (e.g., verifying active member status) to improve user feedback before hitting transactional API endpoints.
* **Responsive Design:** Built using Tailwind CSS for a mobile-first user experience.
* **Error Handling:** Utilizes the **`useToast` hook** to present granular error messages derived directly from the API's status codes.
* **Data Consistency:** Complex API responses (often normalized joins from the backend) are immediately **reshaped and normalized** into simple, UI-friendly JavaScript objects within the Container/Page components.

---

## Structure and API Communication

| Directory | Type | Key Responsibility |
| :--- | :--- | :--- |
| **`/src/pages`** | **Page Containers (Views)** | **Main Layout**, all **business logic**, state management, and implementation of complex features like search debouncing. |
| **`/src/components`** | Presentational | Reusable UI elements (`DataTable`, `FormModal`), focused on rendering, receiving data via props. |
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
