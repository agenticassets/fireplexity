import { NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse, convertToModelMessages } from 'ai'
import type { ModelMessage } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { selectRelevantContent } from '@/lib/content-selection'
import { getScrapeOptionsWithFiltering, filterSearchResults, DEFAULT_ALLOWED_DOMAINS, DEFAULT_BLOCKED_DOMAINS } from '@/lib/site-filtering'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    const body = await request.json()
    const messages = body.messages || []
    
    // Extract query from v5 message structure (messages have parts array)
    let query = body.query
    if (!query && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.parts) {
        // v5 structure
        const textParts = lastMessage.parts.filter((p: any) => p.type === 'text')
        query = textParts.map((p: any) => p.text).join(' ')
      } else if (lastMessage.content) {
        // Fallback for v4 structure
        query = lastMessage.content
      }
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Use API key from request body if provided, otherwise fall back to environment variable
    const firecrawlApiKey = body.firecrawlApiKey || process.env.FIRECRAWL_API_KEY
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!firecrawlApiKey) {
      return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 })
    }
    
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    // Configure Groq with the OSS 120B model
    const groq = createGroq({
      apiKey: groqApiKey
    })

    // Always perform a fresh search for each query to ensure relevant results
    const isFollowUp = messages.length > 2
    
    // Create a UIMessage stream with custom data parts
    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        try {
          let sources: Array<{
            url: string
            title: string
            description?: string
            content?: string
            markdown?: string
            publishedDate?: string
            author?: string
            image?: string
            favicon?: string
            siteName?: string
          }> = []
          let newsResults: Array<{
            url: string
            title: string
            description?: string
            publishedDate?: string
            source?: string
            image?: string
          }> = []
          let imageResults: Array<{
            url: string
            title: string
            thumbnail?: string
            source?: string
            width?: number
            height?: number
            position?: number
          }> = []
          let context = ''
          
          // Send status updates as transient data parts
          writer.write({
            type: 'data-status',
            id: 'status-1',
            data: { message: 'Starting search...' },
            transient: true
          })
          
          writer.write({
            type: 'data-status',
            id: 'status-2',
            data: { message: 'Searching for relevant sources...' },
            transient: true
          })
          
          // Make direct API call to Firecrawl v2 search endpoint
          const searchResponse = await fetch('https://api.firecrawl.dev/v2/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: query,
              sources: ['web', 'news'],
              limit: 6,
              scrapeOptions: getScrapeOptionsWithFiltering({
                // Uncomment and modify these to limit search to specific sites:
                includeDomains: ['cbre.com', 'greenstreet.com', 'prea.org', 'ncreif.org', 'uli.org', 'afire.org', 'nar.realtor', 'irei.com', 'jll.com', 'cushmanwakefield.com', 'trepp.com', 'jpmorgan.com', 'colliers.com', 'costar.com', 'msci.com', 'moodyscre.com', 'compstak.com', 'realcapanalytics.com', 'affiniuscapital.com', 
                  'blackstone.com', 'brookfield.com', 'nuveen.com', 'pgim.com', 'metlife.com', 
                  'aecrealestate.com', 'heglobal.com', 'pimco.com', 'gic.com.sg', 'oxfordproperties.com', 
                  'apg-am.nl', 'tishmanspeyer.com', 'hines.com', 'blackrock.com', 
                  'cambridgeassociates.com', 'preqin.com', 'pitchbook.com', 'ft.com/real-estate', 
                  'reuters.com/markets/real-estate', 'bis.org', 'imf.org', 'worldbank.org'],
                // includeDomains: ['wikipedia.org', 'github.com'],
                // excludeDomains: ['facebook.com', 'twitter.com'],
                // includeUrls: ['https://news.ycombinator.com/*'],
                // excludeUrls: ['https://spam-site.com/*']
              })
            })
          })

          if (!searchResponse.ok) {
            const errorData = await searchResponse.json()
            throw new Error(`Firecrawl API error: ${errorData.error || searchResponse.statusText}`)
          }

          const searchResult = await searchResponse.json()
          const searchData = searchResult.data || {}
          
          // Extract results from the v2 SDK response
          const webResults = searchData.web || []
          const newsData = searchData.news || []
          const imagesData = searchData.images || []
          
          // Transform web sources metadata
          sources = webResults.map((item: any) => {
            return {
              url: item.url,
              title: item.title || item.url,
              description: item.description || item.snippet,
              content: item.content,
              markdown: item.markdown,
              favicon: item.favicon,
              image: item.ogImage || item.image || item.metadata?.ogImage,  // Add ogImage support
              siteName: new URL(item.url).hostname
            };
          }).filter((item: any) => item.url) || []
          
          // Apply site filtering to results
          sources = filterSearchResults(sources, {
            includeDomains: ['cbre.com', 'greenstreet.com', 'prea.org', 'ncreif.org', 'uli.org', 'afire.org', 'nar.realtor', 'irei.com', 'jll.com', 'cushmanwakefield.com', 'trepp.com', 'jpmorgan.com', 'colliers.com', 'costar.com', 'msci.com', 'moodyscre.com', 'compstak.com', 'realcapanalytics.com', 'affiniuscapital.com', 
              'blackstone.com', 'brookfield.com', 'nuveen.com', 'pgim.com', 'metlife.com', 
              'aecrealestate.com', 'heglobal.com', 'pimco.com', 'gic.com.sg', 'oxfordproperties.com', 
              'apg-am.nl', 'tishmanspeyer.com', 'hines.com', 'blackrock.com', 
              'cambridgeassociates.com', 'preqin.com', 'pitchbook.com', 'ft.com/real-estate', 
              'reuters.com/markets/real-estate', 'bis.org', 'imf.org', 'worldbank.org']
          })

          // Transform news results - now with correct schema
          newsResults = newsData.map((item: any) => {
            return {
              url: item.url,
              title: item.title,
              description: item.snippet || item.description,
              publishedDate: item.date,  // Direct API returns 'date' field
              source: item.source || (item.url ? new URL(item.url).hostname : undefined),
              image: item.imageUrl  // Direct API returns 'imageUrl' for news thumbnails
            };
          }).filter((item: any) => item.url) || []
          
          // Apply site filtering to news results
          newsResults = filterSearchResults(newsResults, {
            // Allow major news outlets plus real estate specific sources
            includeDomains: [
              // Real Estate Specific
              'cbre.com', 'greenstreet.com', 'prea.org', 'ncreif.org', 'uli.org', 'naiop.org',
              'costar.com', 'bisnow.com', 'therealdeal.com', 'nreionline.com', 'globest.com',
              'housingwire.com', 'realtor.org', 'irei.com', 'trepp.com',
              // Major News Outlets
              'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'cnbc.com', 'cnn.com',
              'bbc.com', 'apnews.com', 'npr.org', 'marketwatch.com', 'yahoo.com',
              // Business News
              'businessinsider.com', 'forbes.com', 'fortune.com', 'economist.com',
              // Financial Data
              'fred.stlouisfed.org', 'bis.org', 'imf.org', 'worldbank.org'
            ]
          })

          // Transform image results - now with correct schema from direct API
          imageResults = imagesData.map((item: any) => {
            // Verify we have the required fields
            if (!item.url || !item.imageUrl) {
              return null;
            }
            return {
              url: item.url,
              title: item.title || 'Untitled',
              thumbnail: item.imageUrl,  // Direct API returns 'imageUrl' field
              source: item.url ? new URL(item.url).hostname : undefined,
              width: item.imageWidth,
              height: item.imageHeight,
              position: item.position
            };
          }).filter(Boolean) || []  // Filter out null entries
          
          // Apply site filtering to image results
          imageResults = filterSearchResults(imageResults, {
            includeDomains: ['cbre.com', 'greenstreet.com', 'prea.org', 'ncreif.org', 'uli.org', 'afire.org', 'nar.realtor', 'irei.com', 'jll.com', 'cushmanwakefield.com', 'trepp.com', 'jpmorgan.com', 'colliers.com', 'costar.com', 'msci.com', 'moodyscre.com', 'compstak.com', 'realcapanalytics.com', 'affiniuscapital.com', 
              'blackstone.com', 'brookfield.com', 'nuveen.com', 'pgim.com', 'metlife.com', 
              'aecrealestate.com', 'heglobal.com', 'pimco.com', 'gic.com.sg', 'oxfordproperties.com', 
              'apg-am.nl', 'tishmanspeyer.com', 'hines.com', 'blackrock.com', 
              'cambridgeassociates.com', 'preqin.com', 'pitchbook.com', 'ft.com/real-estate', 
              'reuters.com/markets/real-estate', 'bis.org', 'imf.org', 'worldbank.org']
          })
          
          // Send all sources as a persistent data part
          writer.write({
            type: 'data-sources',
            id: 'sources-1',
            data: {
              sources,
              newsResults,
              imageResults
            }
          })
          
          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Update status
          writer.write({
            type: 'data-status',
            id: 'status-3',
            data: { message: 'Analyzing sources and generating answer...' },
            transient: true
          })
          
          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          if (ticker) {
            writer.write({
              type: 'data-ticker',
              id: 'ticker-1',
              data: { symbol: ticker }
            })
          }
          
          // Prepare context from sources with intelligent content selection
          context = sources
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const relevantContent = selectRelevantContent(content, query, 2000)
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevantContent}`
            })
            .join('\n\n---\n\n')

          
          // Prepare messages for the AI
          let aiMessages: ModelMessage[] = []
          
          if (!isFollowUp) {
            // Initial query with sources
            aiMessages = [
              {
                role: 'system',
                content: `You are an expert real estate research assistant that helps users find information.

                CRITICAL FORMATTING RULE:
                - NEVER use LaTeX/math syntax ($...$) for regular numbers in your response
                - Write ALL numbers as plain text: "1 million" NOT "$1$ million", "50%" NOT "$50\\%$"
                - Only use math syntax for actual mathematical equations if absolutely necessary
                
                RESPONSE CONTENT:
                - Assume the user is a real estate professional and provide answers that are relevant to their industry
                - Assume the user is searching for real estate industry research and insights on the topic of the query
                - Provide answers that are accurate and up to date
                - Provide answers that are practical and actionable

                RESPONSE STYLE:
                - Begin by noting the sources you used to answer the query
                - For simple questions, give direct, concise answers
                - For complex topics, provide detailed explanations only when needed
                
                FORMAT:
                - Use markdown for readability when appropriate
                - Keep responses natural and conversational
                - Cite sources within the response
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          } else {
            // Follow-up question - still use fresh sources from the new search
            aiMessages = [
              {
                role: 'system',
                content: `You are an expert real estate research assistant continuing our conversation.

                CRITICAL FORMATTING RULE:
                - NEVER use LaTeX/math syntax ($...$) for regular numbers in your response
                - Write ALL numbers as plain text: "1 million" NOT "$1$ million", "50%" NOT "$50\\%$"
                - Only use math syntax for actual mathematical equations if absolutely necessary
                
                REMEMBER:
                - Keep the same conversational tone from before
                - Build on previous context naturally
                - Match the user's communication style
                - Use markdown when it helps clarity
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              // Include conversation context - convert UIMessages to ModelMessages
              ...convertToModelMessages(messages.slice(0, -1)),
              // Add the current query with the fresh sources
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          }
          
          // Stream the text generation using Groq's Kimi K2 Instruct model
          const result = streamText({
            model: groq('llama-3.1-8b-instant'),
            messages: aiMessages,
            temperature: 0.7,
            maxRetries: 2
          })
          
          // Merge the AI stream into our UIMessage stream
          writer.merge(result.toUIMessageStream())
          
          // Get the full answer for follow-up generation
          const fullAnswer = await result.text
          
          // Generate follow-up questions
          const conversationPreview = isFollowUp 
            ? messages.map((m: { role: string; parts?: any[] }) => {
                const content = m.parts 
                  ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
                  : ''
                return `${m.role}: ${content}`
              }).join('\n\n')
            : `user: ${query}`
            
          try {
            const followUpResponse = await generateText({
              model: groq('moonshotai/kimi-k2-instruct'),
              messages: [
                {
                  role: 'system',
                  content: `Generate 5 natural follow-up questions based on the query and answer.\n                \n                ONLY generate questions if the query warrants them:\n                - Skip for simple greetings or basic acknowledgments\n                - Create questions that feel natural, not forced\n                - Make them genuinely helpful, not just filler\n                - Focus on the topic and sources available\n                \n                If the query doesn't need follow-ups, return an empty response.
                  ${isFollowUp ? 'Consider the full conversation history and avoid repeating previous questions.' : ''}
                  Return only the questions, one per line, no numbering or bullets.`
                },
                {
                  role: 'user',
                  content: `Query: ${query}\n\nAnswer provided: ${fullAnswer.substring(0, 500)}...\n\n${sources.length > 0 ? `Available sources about: ${sources.map((s: { title: string }) => s.title).join(', ')}\n\n` : ''}Generate 5 diverse follow-up questions that would help the user learn more about this topic from different angles.`
                }
              ],
              temperature: 0.7,
              maxRetries: 2
            })
            
            // Process follow-up questions
            const followUpQuestions = followUpResponse.text
              .split('\n')
              .map((q: string) => q.trim())
              .filter((q: string) => q.length > 0)
              .slice(0, 5)

            // Send follow-up questions as a data part
            writer.write({
              type: 'data-followup',
              id: 'followup-1',
              data: { questions: followUpQuestions }
            })
          } catch (followUpError) {
            // Error generating follow-up questions
          }
          
        } catch (error) {
          
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const statusCode = error && typeof error === 'object' && 'statusCode' in error 
            ? error.statusCode 
            : error && typeof error === 'object' && 'status' in error
            ? error.status
            : undefined
          
          // Provide user-friendly error messages
          const errorResponses: Record<number, { error: string; suggestion?: string }> = {
            401: {
              error: 'Invalid API key',
              suggestion: 'Please check your Firecrawl API key is correct.'
            },
            402: {
              error: 'Insufficient credits',
              suggestion: 'You\'ve run out of Firecrawl credits. Please upgrade your plan.'
            },
            429: {
              error: 'Rate limit exceeded',
              suggestion: 'Too many requests. Please wait a moment and try again.'
            },
            504: {
              error: 'Request timeout',
              suggestion: 'The search took too long. Try a simpler query or fewer sources.'
            }
          }
          
          const errorResponse = statusCode && errorResponses[statusCode as keyof typeof errorResponses] 
            ? errorResponses[statusCode as keyof typeof errorResponses]
            : { error: errorMessage }
          
          writer.write({
            type: 'data-error',
            id: 'error-1',
            data: {
              error: errorResponse.error,
              ...(errorResponse.suggestion ? { suggestion: errorResponse.suggestion } : {}),
              ...(statusCode ? { statusCode } : {})
            },
            transient: true
          })
        }
      }
    })
    
    return createUIMessageStreamResponse({ stream })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    return NextResponse.json(
      { error: 'Search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}