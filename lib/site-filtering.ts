// Site filtering configuration
export interface SiteFilterConfig {
  includeDomains?: string[]
  excludeDomains?: string[]
  includeUrls?: string[]
  excludeUrls?: string[]
}

// Default allowed domains (trusted sources)
export const DEFAULT_ALLOWED_DOMAINS = [
  'wikipedia.org',
  'github.com',
  'stackoverflow.com',
  'reddit.com',
  'news.ycombinator.com',
  'techcrunch.com',
  'arstechnica.com',
  'theverge.com',
  'bbc.com',
  'reuters.com',
  'apnews.com',
  'nytimes.com',
  'wsj.com',
  'bloomberg.com',
  'cnn.com',
  'npr.org',
  'scientificamerican.com',
  'nature.com',
  'science.org',
  'arxiv.org',
  'ieee.org',
  'acm.org'
]

// Default blocked domains (spam, low-quality content)
export const DEFAULT_BLOCKED_DOMAINS = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'linkedin.com'
]

// Function to check if a URL should be included based on filters
export function shouldIncludeUrl(url: string, config: SiteFilterConfig = {}): boolean {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.toLowerCase()
    
    // Check excluded domains first
    if (config.excludeDomains?.some(excluded => domain.includes(excluded))) {
      return false
    }
    
    // Check excluded URLs
    if (config.excludeUrls?.some(excluded => url.includes(excluded))) {
      return false
    }
    
    // If includeDomains is specified, only allow those domains
    if (config.includeDomains && config.includeDomains.length > 0) {
      return config.includeDomains.some(included => domain.includes(included))
    }
    
    // If includeUrls is specified, only allow those URLs
    if (config.includeUrls && config.includeUrls.length > 0) {
      return config.includeUrls.some(included => url.includes(included))
    }
    
    // Default: allow all URLs that aren't explicitly excluded
    return true
  } catch {
    // Invalid URL, exclude it
    return false
  }
}

// Function to get Firecrawl scrape options with site filtering
export function getScrapeOptionsWithFiltering(config: SiteFilterConfig = {}): any {
  const options: any = {
    formats: ['markdown'],
    onlyMainContent: true,
    maxAge: 86400000 // 24 hours
  }
  
  // Add include URLs if specified
  if (config.includeUrls && config.includeUrls.length > 0) {
    options.includeUrls = config.includeUrls
  }
  
  // Add exclude URLs if specified
  if (config.excludeUrls && config.excludeUrls.length > 0) {
    options.excludeUrls = config.excludeUrls
  }
  
  return options
}

// Function to filter search results after they're returned
export function filterSearchResults(results: any[], config: SiteFilterConfig = {}): any[] {
  return results.filter(result => shouldIncludeUrl(result.url, config))
}
