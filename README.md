# Simple POS

A simple Point of Sale application built with Node.js, Express, and SQLite.

## Features

*   **Authentication:**
    *   User login with password hashing (bcrypt).
    *   Session management.

*   **Product Management:**
    *   Add, edit, and delete products.
    *   View a list of all products.
    *   Product details include name, price, SKU, stock, and an image.
    *   Image upload for products.

*   **Cashier/Point of Sale:**
    *   A dedicated cashier page for processing sales.
    *   Add products to the cart by SKU or by searching for the product name.
    *   The cart automatically updates the total price.
    *   Create a new transaction from the cart.

*   **Transaction Management:**
    *   View a list of all transactions.
    *   View detailed information for each transaction, including the items purchased.

*   **Statistics:**
    *   A dashboard displaying key metrics for the current day:
        *   Total sales.
        *   Total number of transactions.
        *   Total items sold.
        *   Top 5 best-selling products.
        *   List of recent transactions.

*   **User Management:**
    *   Add, edit (password), and delete users.

*   **Settings:**
    *   Configure application settings, including:
        *   Store name, address, and phone number.
        *   Currency symbol.
        *   Tax percentage and enable/disable tax calculation.
        *   Application theme (light/dark).

## Technology Stack

*   **Backend:** Node.js, Express.js
*   **Database:** SQLite3
*   **Templating Engine:** EJS
*   **Dependencies:**
    *   `bcrypt`: For hashing passwords.
    *   `body-parser`: To parse incoming request bodies.
    *   `dotenv`: To load environment variables from a `.env` file.
    *   `express`: Web framework.
    *   `express-session`: For session management.
    *   `multer`: For handling file uploads.
    *   `sqlite3`: SQLite database driver.

## Getting Started

### Prerequisites

*   Node.js and npm installed.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/simple-pos.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd simple-pos
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the server:
    ```bash
    node server.js
    ```
2.  Open your browser and navigate to `http://localhost:3000`.

### Default Login

*   **Username:** admin
*   **Password:** belajarlah

## Database Schema

The application uses a SQLite database (`simplepos.db`) with the following tables:

*   `users`: Stores user information (username, password).
*   `products`: Stores product details (name, price, SKU, stock, image\_url).
*   `transactions`: Stores transaction information (total\_amount, timestamp).
*   `transaction_items`: Stores individual items within a transaction.
*   `settings`: Stores application settings as key-value pairs.
