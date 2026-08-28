# Jacker

Jacker is a minimal, browser-only job tracker for keeping applications organized without accounts, sync, or server storage.

## Why Jacker

Job tracking should be quick. Jacker keeps the workflow focused on the details that matter:

- company name
- role
- applied date
- job link
- last follow-up date
- status
- referral or contact link

The interface is intentionally black and white. There are no dashboards, signups, notifications, or extra views to manage.

## Why Web-Based And Local

Jacker runs as a web app because the browser already gives you a fast, familiar interface for forms, tables, sorting, links, and saved preferences.

Your data is stored in the browser's local storage. That means:

- no account is required
- no backend server is needed
- no job data is uploaded by the app
- the tracker works for personal use on your own machine

Because storage is local to the browser, clearing browser data or using a different browser/device will not carry your saved jobs over automatically.

## Features

- Add, edit, and delete job applications.
- Sort by applied date, last follow-up date, and status.
- Switch between black and white themes.
- Store all job data locally in the browser.
- Open job links directly from the table.
- Make referral URLs clickable, including LinkedIn links.
- Automatically mark active applications as closed when they are more than 30 days old.

## Usage

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

## Notes

Jacker starts empty in every new browser. Your entries appear only after you add them, and they remain local to that browser.
