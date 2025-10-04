# Hospital Management System (Next.js) v2

A modern hospital management system built with **Next.js**, created as the second version of your project for the INSA Summer Program. This version improves upon the earlier React + Express build with better performance, structure, and developer experience.

---

## 🚀 Features

- User authentication & role-based access (Admin, Doctor, Nurse, Patient)
- Patient record management (CRUD)
- Appointment scheduling
- Medical history and report management
- Dashboard with key hospital stats
- Responsive UI (desktop & mobile)
- Secure data handling using Prisma ORM
- Middleware for request validation & authorization

---

## 🛠 Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: Prisma ORM with PostgreSQL/MySQL/SQLite
- **Auth**: JWT / NextAuth (or custom implementation)
- **Other tools**: ESLint, Prettier

---

## 📦 Getting Started

### Prerequisites

- Node.js (16+)
- npm / yarn / pnpm
- Database (PostgreSQL, MySQL, or SQLite)

### Installation

```bash
git clone https://github.com/tedacodder/hospital-management-system-nextjs.git
cd hospital-management-system-nextjs
npm install
```

Run database migrations:

```bash
npx prisma migrate dev
```

### Configuration

Create a `.env` file:

```
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
hospital-management-system-nextjs/
├── app/           # Routes, layouts, UI components
├── lib/           # Helpers and utilities
├── prisma/        # Prisma schema & migrations
├── public/        # Static files
├── styles/        # Global styles
├── middleware.ts  # Auth / validation middleware
├── next.config.js # Next.js config
└── package.json   # Dependencies & scripts
```

---

## 📌 Roadmap

- [ ] Notifications (email/SMS reminders)
- [ ] Billing & invoicing module
- [ ] Real-time chat between patients and doctors
- [ ] Audit logs & advanced role permissions
- [ ] Deployment (Vercel / AWS / DigitalOcean)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built by **cody (tedacodder)** for the **INSA Summer Program 2025**.
