# VentureFlow - VC Intelligence Platform

A modern web application for discovering and enriching venture capital company data with AI-powered insights. Built with Next.js, React, and OpenAI's language models.

## Features

- **Company Search & Discovery**: Browse and search through a curated database of venture capital companies
- **AI-Powered Enrichment**: Automatically enrich company data with detailed information including:
  - Company summaries and descriptions
  - What they do (business focus)
  - Key industry keywords and signals
  - Data sources and verification
  - Investment signals and metrics
- **Smart Lists**: Create and manage custom company lists with bulk operations
- **Saved Searches**: Save your search filters for quick future access
- **Company Notes**: Add private notes to companies for personal tracking
- **Keyboard Shortcuts**: Press "E" to enrich, "N" to add notes, and more
- **Export Capabilities**: Export lists to CSV and JSON formats
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Custom React components with Tailwind CSS
- **Data Visualization**: Recharts for analytics
- **Icons**: Lucide React
- **Dates**: date-fns for date formatting
- **AI Integration**: OpenAI API (GPT-4 Turbo)
- **Storage**: Browser localStorage for data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vc-intelligence-interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or with pnpm:
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your OpenAI API key
   # OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or with pnpm:
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

All configuration is managed through `.env.local` (copy from `.env.example`):

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for enrichment | - | Yes |
| `OPENAI_MODEL` | OpenAI model to use | gpt-4-turbo | No |
| `RATE_LIMIT_PER_MINUTE` | Max enrichment requests per minute | 10 | No |
| `ENABLE_CACHE` | Enable result caching | true | No |
| `CACHE_TTL` | Cache time-to-live in milliseconds | 604800000 (7 days) | No |

### Getting an OpenAI API Key

1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (it won't be shown again)
4. Add it to your `.env.local` file

## Usage

### Main Navigation

- **Companies**: Browse and search all companies in the database
- **Lists**: Manage your custom company lists
- **Saved**: View your saved searches for quick filtering
- **Settings**: Manage cache and application preferences

### Enriching Company Data

1. Navigate to a company profile
2. Click the "Enrich" button or press "E"
3. The system will fetch live data and extract key information
4. View the enriched data in the profile

### Creating and Managing Lists

1. Go to the Lists section
2. Click "Create New List"
3. Add companies to your list
4. Use bulk actions to export or manage multiple companies
5. Export as CSV or JSON for external use

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `E` | Enrich the current company |
| `N` | Add or edit notes for a company |
| `Ctrl+K` / `Cmd+K` | Open global search |

## API Endpoints

### POST `/api/enrich`

Enriches company data using AI.

**Request:**
```json
{
  "companyName": "string",
  "website": "string (optional)",
  "companyUrl": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "string",
    "whatTheyDo": "string",
    "keywords": ["string"],
    "signals": ["string"],
    "sources": ["string"],
    "cached": false,
    "timestamp": "ISO 8601 date string"
  },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

## Data Persistence

The application uses browser localStorage to persist:
- Company lists and their members
- Saved search filters
- Company notes
- Follow/bookmark status

Data is stored locally on your device and not sent to any external servers (except OpenAI for enrichment).

## Development

### Project Structure

```
├── app/
│   ├── api/
│   │   └── enrich/           # AI enrichment API route
│   ├── companies/            # Companies page
│   ├── lists/                # Lists management
│   ├── saved/                # Saved searches
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home redirect
│   └── globals.css           # Global styles
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Topbar.tsx            # Top navigation
│   ├── SearchBar.tsx         # Search component
│   ├── LoadingSkeleton.tsx   # Loading states
│   ├── Toast.tsx             # Notifications
│   └── CompaniesClient.tsx   # Companies list component
├── lib/
│   ├── mockData.ts           # Mock company data
│   ├── storage.ts            # localStorage utilities
│   ├── enrichmentQueue.ts    # Request queuing system
│   ├── rateLimiter.ts        # Rate limiting
│   └── cache.ts              # Cache management
├── types/
│   └── index.ts              # TypeScript type definitions
└── public/                   # Static assets
```

### Building for Production

```bash
npm run build
npm run start
```

The production build will be optimized and ready for deployment.

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add `OPENAI_API_KEY` (and other variables from `.env.example`)
   - Click "Deploy"

4. **Your app is live!**
   Your app will be available at a URL like `your-project.vercel.app`

### Deploy to Other Platforms

The app can also be deployed to:
- **Netlify**: Requires Next.js adapter
- **AWS Amplify**: Select Node.js runtime
- **Self-hosted**: Build and run with `npm run build && npm run start`

## Rate Limiting

The enrichment API implements rate limiting to prevent excessive API usage:
- Default: 10 requests per minute per user
- Queues requests when limit is reached
- Returns 429 status when rate limited

Configure with `RATE_LIMIT_PER_MINUTE` environment variable.

## Caching

Enrichment results are cached to reduce API costs and improve performance:
- Cache TTL: 7 days by default
- Cached results are clearly marked
- Disable with `ENABLE_CACHE=false`
- Manual cache clearing available in Settings

## Error Handling

The application includes comprehensive error handling:
- **API Errors**: Graceful fallback to mock data
- **Network Issues**: Automatic retry with exponential backoff
- **Rate Limiting**: Queue system with clear user feedback
- **Validation Errors**: Detailed error messages for user guidance

All errors are logged with context for debugging.

## Troubleshooting

### OpenAI API Key not working

1. Verify the key is correctly set in `.env.local`
2. Check the key is valid at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Ensure the key has API access enabled
4. Check your OpenAI account has sufficient credits

### Enrichment requests failing

1. Check internet connection
2. Verify OpenAI API key is valid
3. Ensure company name and website are provided
4. Check browser console for detailed error messages
5. Try again in a few moments (may be a temporary API issue)

### Data not persisting

1. Check if localStorage is enabled in browser settings
2. Verify you're not in private/incognito mode
3. Check browser storage isn't full
4. Try clearing cache and reloading

## Performance Tips

- Use company search to filter before enriching
- Batch enrichment operations during off-peak hours
- Export data to manage locally to reduce app complexity
- Clear cache periodically to maintain performance

## License

MIT License - feel free to use this project for personal or commercial use.

## Support

For issues, questions, or suggestions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Create an issue on GitHub with detailed information

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Changelog

### Version 1.0.0
- Initial release with core features
- Company search and enrichment
- List management
- Saved searches
- Notes and follow functionality
- Comprehensive error handling
- Rate limiting and caching
