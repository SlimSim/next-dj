@echo off
REM Install PWA dependencies
npm install next-pwa

REM Install shadcn/ui and its dependencies
npm install @shadcn/ui class-variance-authority clsx tailwind-merge lucide-react

REM Install UI components and utilities
npm install sonner @radix-ui/react-slider @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
npm install @radix-ui/react-toggle @radix-ui/react-switch @radix-ui/react-progress

REM Install database and file handling
npm install idb

REM Install testing libraries
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest

REM Install additional utilities
npm install zustand immer

REM Install necessary dependencies
npm install -D typescript @types/node @types/react @types/react-dom eslint
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npm install -D @types/node@20.11.30
npx tailwindcss init -p
