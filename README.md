# paBondi Online Marketplace

Welcome to paBondi, a modern e-commerce platform built with Next.js that connects customers with their favorite local stores. This application provides a seamless shopping experience, allowing users to browse products, manage a multi-store cart, and track orders with real-time delivery cost calculations.

![paBondi Screenshot](https://placehold.co/800x450.png?text=paBondi+App+Screenshot)

## Features

- **Product & Store Discovery**: Browse a wide range of products and explore various local stores.
- **Categorized Browsing**: Products and stores are organized by category, with clickable titles on the homepage for easy filtering.
- **Swipeable Carousels**: Interactive and touch-friendly carousels on the homepage for featured items.
- **Advanced Search & Filtering**: Easily find products or stores using search and filter options.
- **Dynamic Shopping Cart**: Add products from multiple stores into a single, unified cart.
- **Multi-Store Checkout**: A streamlined checkout process that handles orders from multiple stores simultaneously.
- **Real-time Delivery Calculation**: Utilizes OpenRouteService to calculate delivery fees based on the user's and stores' geographical coordinates.
- **Order Tracking**: Users can track the status of their orders using their Order ID, email, or name.
- **Responsive Design**: A modern, clean, and fully responsive UI built with Shadcn/ui and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**: [Supabase](https://supabase.io/)
- **Geolocation & Routing**: [OpenRouteService API](https://openrouteservice.org/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.io/) account and a new project.
- An [OpenRouteService API Key](https://openrouteservice.org/dev/#/home).

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/your-username/pabondi-marketplace.git
cd pabondi-marketplace
```

### 2. Install Dependencies

Install the project dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a new file named `.env.local` in the root of your project directory. Copy the contents of `.env.example` (if available) or add the following variables, replacing the placeholder values with your actual credentials.

```env
# Supabase Project Credentials
# Get these from your Supabase project's "Project Settings" > "API"
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# OpenRouteService API Key
# Get this from your OpenRouteService developer dashboard
OPEN_ROUTE_SERVICE_API_KEY=YOUR_ORS_API_KEY_HERE
```

**Note:** You will need to set up your Supabase database schema. You can do this manually or by running the SQL scripts provided in your Supabase project's dashboard.

### 4. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com/).

### 1. Push to a Git Repository

Push your project to a GitHub, GitLab, or Bitbucket repository.

### 2. Import Project on Vercel

- Go to your Vercel dashboard and click **"Add New..."** -> **"Project"**.
- Import your Git repository.

### 3. Configure Environment Variables

During the import process, Vercel will ask you to configure your project.
- Go to the **Environment Variables** section.
- Add the same variables from your `.env.local` file:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPEN_ROUTE_SERVICE_API_KEY`

**Important**: Ensure you use the credentials for your **production** Supabase project.

### 4. Deploy

Click the **"Deploy"** button. Vercel will automatically build and deploy your application. Once complete, you will get a public URL for your live site.

### Connecting a Custom Domain (e.g., from Hostinger)

1.  **Add Domain in Vercel**:
    - In your Vercel project, go to **Settings -> Domains**.
    - Add your custom domain. Vercel will provide you with the required DNS records (usually Nameservers).

2.  **Update DNS in Hostinger**:
    - Log in to your Hostinger account and navigate to your domain's DNS settings.
    - Change the nameservers to the ones provided by Vercel.

3.  **Wait for Propagation**:
    - DNS changes may take some time to propagate. Vercel will automatically verify the domain and issue an SSL certificate.
