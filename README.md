# CertiPulse 🎓

**CertiPulse** is a modern, high-performance Certificate Generation, Management, and Verification platform. Built with Next.js, React, TypeScript, and Prisma, it allows organizations to easily upload participant details, design custom templates, issue verified digital certificates, and enable public certificate lookup and correction requests.

🌐 **Live Website / Host URL:** [https://certipulse.uudoon.in](https://certipulse.uudoon.in)

---

## 🌟 Key Features

### 👤 User Portal & Public Search
- **Certificate Verification & Lookup:** Search certificates by email, phone, or certificate ID.
- **Preview & Download:** High-resolution preview with single-click PNG/PDF downloading.
- **Correction Requests:** Allows certificate holders to submit correction requests (e.g. name misspelling or details update).

### 🛠️ Admin Management Dashboard
- **Bulk Import:** Upload Excel (`.xlsx`) files containing participant details for batch certificate generation.
- **Template & Asset Manager:** Manage background graphics, signatures, seals, and layout configurations.
- **Correction Requests Hub:** Review, approve, or reject participant correction requests with automated status updates.
- **Analytics & Tracking:** View generation metrics, issue counts, and active templates.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend:** React 19, TypeScript, Tailwind CSS, [Framer Motion](https://www.framer.com/motion/)
- **Icons & Effects:** [Lucide React](https://lucide.dev/), Canvas Confetti
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with SQLite (`better-sqlite3`)
- **Excel Processing:** XLSX (`xlsx`)
- **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/certipulse.git
   cd certipulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker

You can also run the application using Docker Compose:

```bash
# Build and start container in detached mode
docker compose up -d
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Hosted Instance

The production deployment of CertiPulse is hosted at:
👉 **[https://certipulse.uudoon.in](https://certipulse.uudoon.in)**

---

## 📄 License

This project is licensed under the MIT License.
