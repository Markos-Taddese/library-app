# Backend API: Library Management System (LMS-API)

**Tagline:** A robust, **transaction-safe** RESTful API built on Node.js/Express with a **normalized MySQL database** for managing books, members, and complex loan operations.

---

## Key Features

* **Fully Normalized Database:** Uses a Third Normal Form (3NF) MySQL schema, ensuring data integrity by separating Titles, Copies, and Loans.
* **Normalized Catelog Design:** The Book Controller manages a complex, normalized structure where **book titles** are separated from **physical copies** and **authors**. Retrieving a single book's detail requires multi-table joins (Title, Author, Copies) and aggregation to report accurate, real-time availability.involves complex joins and aggregation to report accurate availability across all copies.
* **Transaction-Safe Loan Management:** Critical operations (`createLoans`, `returnLoan`,`renwalLoan`) are wrapped in **database transactions** with connection locking (`FOR UPDATE`) to prevent race conditions.
* **Cascading Deletion Logic:** The Book DELETE endpoint performs a smart, conditional, cascading cleanup (copy deletion $\rightarrow$ book title removal $\rightarrow$ author removal) to prevent orphaned records.
* **Comprehensive Reporting:** Includes advanced endpoints for fetching active loans, overdue items, and aggregate reports.
* **Efficient Member Management:** The Member Controller provides custom search functionality and serves as the crucial validation source for all new loans.
* **Modular Architecture:** Clear separation of concerns using Controllers, Routes, and Config files.

---
## Member Status & Data Integrity (Soft Delete)

* To ensure that historical loan data is never lost, the system uses a Soft Deletion approach for members:

* Instead of being permanently removed, a member's record is marked with an is_deleted = TRUE flag.

* The Loan Controller rigorously checks this status: any attempt to use the /loans/ or /loans/renewal endpoints by a member with is_deleted = TRUE will be immediately rejected, enforcing that deactivated members cannot borrow or renew books.

## Technologies Used

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MySQL (using `mysql2/promise` for connection pooling)
* **Configuration:** Uses the **`dotenv`** package to manage environment variables loaded from a local `.env` file for secure credentials.

---

## Database Schema Overview (Normalized)

The system is built around five main tables to ensure data integrity and flexibility:

| Table | Primary Purpose | Key Normalization Points |
| :--- | :--- | :--- |
| **`books`** | Stores only the title. | Linked to Authors and Copies. |
| **`authors`** | Stores author details. | Linked to `books` via `author_id`. |
| **`book_copies`** | Stores individual physical items. | Contains the **`status`** (`available`, `loaned`) field. |
| **`members`** | Stores member details. | |
| **`loans`** | Records loan transactions. | Links a **physical copy** (`copy_id`) to a **member** (`member_id`). |
**Core Relationship:** The structural complexity involves a three-way link to manage the catalog and loan events:

$$\text{Loan Event} \longrightarrow \text{Physical Copy} \longrightarrow \text{Book Title} + \text{Author}$$

---

## Setup and Installation

**Pre-requisites:** Ensure your Node.js runtime and MySQL database server are installed and running.
1.  **Configuration:** The project requires a **`.env`** file placed inside the **`backend/`** folder. Use the following template, substituting the **placeholder values** with the required local credentials (Note: These values are **NOT** committed to Git):
    ```
    DB_HOST=localhost
    DB_USER=[YOUR_DB_USERNAME]
    DB_PASSWORD=[YOUR_DB_PASSWORD]
    DB_DATABASE=[YOUR_DB_NAME]
    PORT=3000
    ```
2.  **Navigate to Backend:**
    ```bash
    cd backend
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Database Setup:**
    * Create the necessary database (`library_db` or whatever name you used).
    * The table structure is in the schema.sql file. Run the following command from your terminal to execute the script and create all tables:
    ```bash
    mysql -u [YOUR_DB_USER] -p [YOUR_DB_NAME] < schema.sql
    ```
5.  **Start the API Server:**
    ```bash
    npm start
    ```

The API will be running at `http://localhost:3000`.

---

## API Endpoints

All paths listed below start after the server address (e.g., `http://localhost:3000`). **Note the mandatory modular prefix for each controller (`/books`, `/members`, `/loans`).**

| Controller | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Books** | `POST` | `/books/` | Add a new book title and its first copy, OR adds a copy to an existing title (smart insert). |
| **Books** | `GET` | `/books/all` | Retrieve all book titles,authors and their copy status. |
| **Books** | `GET` | `/books/search` | **Search the catalog** by title and/or author using the `?search=` query parameter. Can optionally filter to only show available books using `?available=true`. |
| **Books** | `GET` | `/books/stats` | Retrieve statistics for total unique book and totl available copies. |
| **Books** | `PUT` | `/books/:id` | **Update a book title's metadata by its `book_id`**. Supports updating the title, year and `author_name`. If the author changes, the old author record is **transactionally removed** if no other books are linked to them. |
| **Books** | `GET` | `/books/:id` | Retrieve details for a specific book title. |
| **Books** | `DELETE` | `/books/:id` | **Deletes one specific book copy identified by its `copyId`**. This is a **cascading, transactional operation**: If the copy deleted was the last one, the book title is automatically removed; if that was the author's last book, the author record is also removed. |
| **Loans** | `POST` | `/loans/` | Requires Active Member (members.is_deleted = FALSE). Checks book availability and member activness to be fully implemented (transactional). |
| **Loans** | `PUT` | `/loans/return` | Mark a loan as returned (transactional). |
| **Loans** | `PUT` | `/loans/renewal` | Requires Active Member (members.is_deleted = FALSE). Loan must be currently active (return_date IS NULL) and not overdue (due_date >= CURRENT_DATE()). This uses an UPDATE JOIN to enforce the member status check. (transactional). |
| **Loans** | `GET` | `/loans/active` | Retrieve all currently active loans/even with inactive members. |
| **Loans** | `GET` | `/loans/overdue` | Retrieve a list of all overdue loans. |
| **Loans** | `GET` | `/loans/overdue/members`| Report: Members and their overdue count. |
| **Loans** | `GET` | `/loans/history/member/:id` | Retrieve the loan history for a specific member ID, even if the member was soft delted. |
| **Loans** | `GET` | `/loans/history/book/:id` | Retrieve the loan history for a specific book title ID. |
| **Members** | `POST` | `/members/` | Create a new member, avoid duplication but reactivate deactivated members (transactional). |
| **Members** | `GET` | `/members/all` | Retrieve all members. Must filter to exclude soft-deleted members. |
| **Members** | `GET` | `/members/search` | Search active members by name or ID. |
| **Members** | `GET` | `/members/stats` | Retrieve total active members. |
| **Members** | `GET` | `/members/:id` | Retrieve details for a specific member ID/all members including soft delted. |
| **Members** | `PUT` | `/members/:id` | Update member information. |
| **Members** | `DELETE` | `/members/:id` | Deactivate (Soft Delete) a specific member, setting is_deleted = TRUE. (Blocked if member has active loans). |

---
