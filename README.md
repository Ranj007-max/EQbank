# PgQbank - Intelligent Medical MCQ Practice

PgQbank is a premier, online-only Progressive Web App (PWA) designed for medical students. It serves as an intelligent MCQ practice tool for deep learning and comprehensive performance tracking. The application is meticulously optimized for a responsive, touch-first experience on Safari for iPad Air.

## Tech Stack

- **Frontend:** React 18 (with Vite) & TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Backend:** Serverless (Designed for Netlify Functions)
- **Deployment:** Netlify

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd pgqbank
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

### Running the Development Server

Once you have installed the dependencies, you can start the development server:

```sh
npm run dev
```

The application will be available at `http://localhost:5173`.

## Deployment

This project is configured for one-click deployment on Netlify. The `netlify.toml` file at the root of the project contains the necessary build commands, function directory, and redirect rules. To deploy your own version, simply connect your forked repository to a new Netlify site.
