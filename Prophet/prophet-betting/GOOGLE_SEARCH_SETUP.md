# Google Search API Setup for AI Arbitrator

The AI arbitrator now has enhanced capabilities to search the web for factual information when resolving bets. This requires setting up Google Custom Search API credentials.

## Prerequisites

1. A Google Cloud Platform account
2. An existing Google Custom Search Engine

## Setup Steps

### 1. Create a Google Custom Search Engine

1. Go to [Google Custom Search](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. For "Sites to search", you can either:
   - Add specific trusted domains (recommended for better security)
   - Use `*` to search the entire web
4. Give your search engine a name (e.g., "Prophet Betting AI Arbitrator")
5. Click "Create"
6. Note down your **Search Engine ID** - you'll need this

### 2. Get Google Custom Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Custom Search API":
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
   - (Optional but recommended) Restrict the API key to only the Custom Search API

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Search API Configuration
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 4. API Limits and Billing

- Google Custom Search API provides 100 free searches per day
- Additional searches cost $5 per 1,000 queries
- Consider setting up billing alerts in Google Cloud Console
- The AI arbitrator is limited to 10 searches per arbitration request

## Security Features

The implementation includes several security measures:

### AI-Driven Source Credibility Evaluation
The AI arbitrator intelligently evaluates source credibility based on:
- Domain type and reputation (.gov, established news organizations, academic institutions)
- Editorial standards and fact-checking practices
- Primary source status vs. secondary reporting
- Potential bias or conflicts of interest
- Corroboration from independent sources

### Jailbreak Protection
The system detects and blocks attempts to manipulate the AI through:
- Suspicious keywords detection
- Input sanitization
- Content validation

### Rate Limiting
- Maximum 10 searches per arbitration request
- Query length limited to 200 characters
- Only alphanumeric characters and basic punctuation allowed in queries

## Usage

Once configured, the AI arbitrator will automatically:

1. Analyze the bet requirements
2. Perform strategic web searches to gather evidence
3. Intelligently evaluate the credibility of each source found
4. Cross-reference information from multiple independent sources
5. Make decisions based on factual information from highly credible sources
6. Provide reasoning with sources consulted and credibility assessments

## Troubleshooting

### "Google Search API not configured" Error
- Verify both `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set
- Check that the API key has the Custom Search API enabled
- Ensure the search engine ID is correct

### AI finds sources but deems them not credible
- The AI may have found sources but evaluated them as unreliable
- This could indicate the topic requires more authoritative sources
- Try broader search terms in your bet descriptions
- Consider if the bet topic has sufficient public documentation for resolution

### Rate Limit Exceeded
- You've exceeded Google's daily free limit (100 searches)
- Enable billing in Google Cloud Console for additional quota
- Wait until the next day for the quota to reset

## Cost Estimation

For a betting platform with moderate AI arbitration usage:
- 10 arbitrations per day × 5 searches each = 50 searches/day
- Well within the 100 free searches per day limit
- For higher volume, expect ~$0.025 per arbitration (at 5 searches each) 