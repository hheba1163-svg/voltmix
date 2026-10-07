This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

For production, run `npm run build`, then `npm run start`. Restart every running `next start` process after rebuilding: existing processes retain the previous build's asset manifest and can return errors for JavaScript/CSS chunks, leaving the public display stuck. Use `npm run dev` while editing code.

The public display is `/display`. New active uploads and saved settings appear within five seconds. Paused advertisements and advertisements whose 24-hour window has expired are excluded. Uploaded media is served through `/api/media/[filename]` with byte-range support; keep `prisma/dev.db` and `public/uploads` on persistent storage.

## Production admin login

Set `ADMIN_EMAIL` and a strong, unique `ADMIN_PASSWORD` as server-side Production environment variables in the hosting provider (for Vercel, Project Settings → Environment Variables), then redeploy. Do not use a `NEXT_PUBLIC_` prefix for either value. When the configured credentials are used to sign in, the application synchronizes the password hash in the database, including for an existing admin account, so changing the production password takes effect on the next login. Keep these variables consistent across production deployments.

For local development only, the default credentials are `admin@voltmix.local` and `admin1234` when no admin credentials are configured.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
