Use this as your **backend `README.md`**:

````md
# Activity 21 - Improved SlimPHP API with Front-End (Back-End)

This is the **SlimPHP + MySQL back-end** for Activity 21.

## Features

- User registration
- Email verification
- Login and logout using JWT authorization
- Forgot password and reset password via email
- User profile update with picture
- CRUD for account items with image upload

---

## Requirements

Make sure these are installed:

- PHP 8+
- Composer
- MySQL / MariaDB
- XAMPP (recommended for Apache/MySQL/PHP local setup)

---

## Project Setup

### 1. Clone or download the project

Put the project folder inside your local workspace, for example:

```bash
C:\Users\antho\Documents\Masteral\MSIT114\Activity20
````

---

### 2. Install dependencies

Open terminal inside the backend folder and run:

```bash
composer install
```

---

### 3. Create the database

Create your MySQL database first.

Database name used in this project:

```txt
account20_db
```

Then import your SQL file into phpMyAdmin or MySQL.

---

### 4. Create the `.env` file

Create a file named:

```txt
.env
```

in the root of the backend project, then paste this:

```env
APP_NAME='Activity21 API'
APP_URL=http://localhost:8080
CLIENT_URL=http://localhost:5173
PORT=8080

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=account20_db
DB_USER=root
DB_PASS=

JWT_SECRET=my_super_secret_key_f3b5259567520e9bfbfc9df50cefc7dc3c578522061e5b2bc53be82f51e80754

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=anthonyjames.nabasca@nmsc.edu.ph
SMTP_PASS="httf tjuh rqzx ugak"
MAIL_FROM=anthonyjames.nabasca@nmsc.edu.ph
```

---

### 5. Make sure uploads folders exist

This project uses image uploads for:

* profile pictures
* account item images

The folders should be inside:

```txt
public/uploads/profile
public/uploads/account
```

If they do not exist yet, create them manually.

Final structure should look like this:

```txt
public/
  index.php
  uploads/
    profile/
    account/
```

---

## Run the Back-End

Inside the backend folder, run:

```bash
php -S localhost:8080 -t public
```

If successful, open:

```txt
http://localhost:8080
```

You should see a JSON response like:

```json
{"message":"Activity 20 API is running."}
```

---

## Important Notes

### 1. Uploaded images

Uploaded images are stored in:

```txt
public/uploads/profile
public/uploads/account
```

Do not move these folders outside `public`, because the local PHP server serves files from the `public` folder.

---

### 2. Local front-end URL

This backend is configured to work with the Vite front-end running at:

```txt
http://localhost:5173
```

---

### 3. Default API base URL

The API runs at:

```txt
http://localhost:8080
```

---

## Main API Routes

### Authentication

* `POST /api/register`
* `GET /api/verify-email?token=...`
* `POST /api/login`
* `POST /api/logout`

### Password Reset

* `POST /api/forgot-password`
* `POST /api/reset-password`

### Profile

* `GET /api/profile`
* `POST /api/profile/update`

### Account Items

* `POST /api/account`
* `GET /api/account`
* `GET /api/account/{id}`
* `POST /api/account/update`
* `DELETE /api/account`

---

## Testing with Postman

Use the API base URL:

```txt
http://localhost:8080
```

Example login:

**POST**

```txt
http://localhost:8080/api/login
```

Body → raw → JSON

```json
{
  "identifier": "your_username_or_email",
  "password": "your_password"
}
```

---

## If `composer` is not recognized

Use:

```bash
php composer.phar install
```

or make Composer global in your system.

---

## If images do not display

Make sure:

* images are saved inside `public/uploads/profile`
* images are saved inside `public/uploads/account`
* you are running the backend with:

```bash
php -S localhost:8080 -t public
```

---

## Author

Activity 21 Back-End using SlimPHP, MySQL, JWT, and PHPMailer/Gmail SMTP.

```


```
