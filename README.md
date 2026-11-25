# Chaibytes Admin Portal

The Chaibytes Admin Portal is a React and TypeScript operations dashboard for managing CRM leads, client accounts, website content, subscribers, campaigns, email delivery, integrations, and media references.

It uses a Vite frontend and connects to the shared FlowNex API. CRM and authentication features use bearer-token and organization-token headers, while shared portfolio, subscriber, campaign, and dashboard features use the API base URL and optional internal API token.

## Implemented Features

### Authentication

- CRM account signup and login
- Password visibility controls and password-strength feedback
- Remember-me handling
- Terms acceptance validation
- Bearer-token and organization data stored in local storage
- Logout with local CRM credentials cleared

### Dashboard

- Workspace metrics for open leads, email messages, subscribers, sent campaigns, clients, and content
- Subscriber growth and email open-rate charts
- Quick actions for creating blog drafts, campaigns, and manual emails
- Recent activity and setup checklist panels
- Command palette shortcut with `Ctrl/Cmd + K`

### Leads CRM

- Search and filter leads by status and source
- Create leads manually
- View, edit, and update lead status and notes
- Lead pipeline for new, contacted, booked, closed, and lost records
- Trigger lead automations
- Send template emails to individual leads
- Connect a lead to Google Calendar
- Schedule, reschedule, and cancel Google Meet bookings
- View lead email history and upcoming meetings

### Clients and Accounts

- Create and maintain client accounts
- Track company, contact, project, contract value, and account status
- Account statuses: active, completed, and on hold
- Create proposals with title and scope value
- Proposal statuses: draft, sent, accepted, or declined
- Add and review service agreements
- Contract statuses: draft, review, signed

### Content Engine

- Arhasoft blog management scoped to `site_key=arahasoft`
- Create, edit, publish, unpublish, search, and delete blog posts
- Markdown article editor with formatting controls
- Preview mode and publish-settings panel
- SEO title and description editing
- Cover image selection
- Category and reading-time fields
- Supported content shortcuts for headings, links, code, quotes, lists, highlights, gradients, stats, callouts, terminals, and CTAs

### Subscribers and Newsletters

- Add and search subscribers
- Subscriber tags and active/unsubscribed status
- Import subscriber records
- Delete subscribers
- Create newsletter campaigns
- Select an email template for a campaign
- Send or schedule campaigns
- Send test emails with variables and attachments
- View sent, draft, open-rate, click-rate, and recipient metrics

### Email

- Email overview with sent, delivered, opened, clicked, and bounced totals
- Recent email activity table
- Filterable email activity by recipient, status, template, and date
- Paginated delivery event list
- Email detail drawer with provider message ID and delivery timeline
- Delivery states including queued, sent, delivered, opened, clicked, bounced, complained, and failed

### Resend Email Templates

- Sync templates from a connected Resend account
- View template status, variables, purpose, and sync state
- Assign a purpose such as lead acknowledgement
- Map template variables to lead fields or static values
- Detect unmapped variables
- Send test emails
- Automatic lead-acknowledgement setup after mapping

### Integrations

- Connect or disconnect Resend
- Configure API key, sender name, sender email, reply-to address, and sending domain
- Test the Resend connection
- Connect or disconnect Google Calendar
- View Google account and calendar details
- Integration setup progress for Resend, sending domain, and Google Calendar

### Media Library

- Index external asset URLs
- Search assets
- Preview images
- Record PDF and image asset metadata
- Copy asset URLs to the clipboard
- Delete indexed asset references

### Settings and Workspace UI

- Update the local admin display name and correspondence email
- Switch between light and dark themes
- Store the Chaibytes internal API token
- Store or enter a CRM bearer token
- Log in and store a CRM token from Settings
- Configure CRM Resend settings
- Configure lead, email, and campaign notification preferences
- Responsive desktop and mobile sidebar navigation
- Quick-action menu, notifications, profile menu, toast notifications, and command palette

## Routes

| Route | Page |
| --- | --- |
| `/` | Dashboard |
| `/leads` | Leads CRM |
| `/subscribers` | Subscribers and campaigns |
| `/content` | Blog content engine |
| `/clients` | Client accounts |
| `/assets` | Media library |
| `/email` | Email overview |
| `/email/templates` | Resend template catalog |
| `/email/templates/:id` | Template purpose and variable mapping |
| `/email/activity` | Email delivery activity |
| `/settings` | Account and API settings |
| `/settings/integrations` | Resend and Google integrations |
| `/settings/google` | Google and integration configuration |

The application uses history-based routing and includes an Nginx SPA fallback for direct route loads.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Recharts
- Lucide React
- Nginx for container serving
- Docker for production deployment

## Project Structure

```text
src/
  components/
    Layout.tsx               Workspace navigation and global header
    CommandPalette.tsx       Keyboard-driven workspace actions
    ComposeEmail.tsx         Manual email composer
    Watermark.tsx            Portal background branding
  context/
    ChaiContext.tsx          Shared application state and API data loading
  pages/
    Auth.tsx                 Signup and login
    Dashboard.tsx            CRM overview and analytics
    Leads.tsx                Lead pipeline and bookings
    Clients.tsx              Client accounts, proposals, contracts
    Blogs.tsx                Markdown content editor
    Newsletter.tsx           Subscribers and campaigns
    Media.tsx                Asset reference library
    EmailOverview.tsx        Email metrics
    EmailTemplates.tsx       Resend template catalog
    EmailTemplateDetail.tsx  Template purpose and mappings
    EmailActivity.tsx        Delivery event search and details
    Integrations.tsx         Resend and Google setup
    Settings.tsx             Local configuration and credentials
  services/
    api.ts                   REST API client and markdown helpers
  utils/
    navigation.ts            Browser history navigation helper
```

## Environment Variables

Create a local environment file from the example:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Preferred API base URL |
| `VITE_BASE_URL` | API base URL fallback |
| `VITE_CHAIBYTES_INTERNAL_API_TOKEN` | Optional internal API token |
| `VITE_CHAIBYTES_CRM_ACCESS_TOKEN` | Optional build-time CRM bearer token fallback |

Example:

```dotenv
VITE_API_URL=https://api.example.com/api
VITE_CHAIBYTES_INTERNAL_API_TOKEN=replace-with-an-internal-api-token
```

If `VITE_API_URL` is not set, the client falls back to `VITE_BASE_URL` and then `http://localhost:8000/api`.

Runtime credentials may also be stored in browser local storage:

- `CHAIBYTES_INTERNAL_API_TOKEN`
- `CHAIBYTES_CRM_ACCESS_TOKEN`
- `CHAIBYTES_CRM_ORG_TOKEN`
- `CHAIBYTES_CRM_ORG_IDENTIFIER`
- `CHAIBYTES_CRM_ORG_DATA`

The Arhasoft content editor always uses `arahasoft` as its shared portfolio site key.

## Local Development

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start Vite:

```bash
npm ci
npm run dev
```

The development server reports the local URL when it starts, normally `http://localhost:5173`.

## Build and Quality Checks

```bash
npm run build
npm run lint
npm run preview
```

The production build runs TypeScript project compilation before generating the Vite bundle.

## Docker Deployment

Build the image:

```bash
docker build \
  --build-arg VITE_BASE_URL=https://flownextai.in/api \
  -t chaibytes-admin .
```

Run the container:

```bash
docker run -d \
  --name chaibytes-admin \
  -p 3001:80 \
  --restart unless-stopped \
  chaibytes-admin
```

The container is served by Nginx on port 80 and published on host port 3001. Nginx serves hashed assets with long-lived caching and redirects unknown SPA routes to `index.html`.

The included `deploy.sh` script:

1. Pulls the latest `main` branch
2. Builds the Docker image
3. Stops and removes the existing container
4. Starts the new container on port `3001`

## API Authentication Notes

- CRM endpoints use `Authorization: Bearer <CRM access token>`.
- Organization-scoped CRM requests add `org_token` to the URL when available.
- Internal shared-API requests include `X-Internal-Api-Token` when configured.
- API requests include `ngrok-skip-browser-warning` for hosted development environments.
- Authentication state is considered active when a CRM access token exists in local storage.
