# BingoLuckyBear

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_LJfwKlxkmcdquFdyCdtlaflTa6oK)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Stitch UI Workflow

This project includes `.stitch/DESIGN.md` and `.stitch/PROMPT.md` so the visual system can be used as a handoff for Google Stitch.

Recommended flow:

1. Open Stitch and create a project for Lucky Bingo Bear.
2. Upload or paste `.stitch/DESIGN.md` as the design system context.
3. Use `.stitch/PROMPT.md` to generate or refine the home, participation, live draw, and winners screens.
4. Export React/Tailwind output and merge it into the existing Next.js components instead of replacing raffle/payment logic.
5. Keep active raffle data wired through `app/page.tsx` and `lib/bingo.ts`.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
