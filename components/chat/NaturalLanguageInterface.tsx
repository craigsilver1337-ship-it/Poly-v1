'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  BarChart2,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Zap,
  Target,
  Brain,
  ArrowRight,
  Clock,
  DollarSign,
  Percent,
  Filter,
  Trophy,
  Flame,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Market } from '@/types';
import { formatPrice, formatCompactNumber } from '@/lib/formatters';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    type: 'markets' | 'analysis' | 'comparison' | 'explanation' | 'suggestion';
    markets?: Market[];
    analysis?: string;
    suggestions?: string[];
  };
}

interface NaturalLanguageInterfaceProps {
  markets: Market[];
  className?: string;
  onMarketSelect?: (market: Market) => void;
}

// Quick action buttons
const QUICK_ACTIONS = [
  { icon: Flame, label: 'Hot Markets', query: 'Show me the hottest markets right now' },
  { icon: Trophy, label: 'Top Volume', query: 'What markets have the highest volume?' },
  { icon: TrendingUp, label: 'Biggest Movers', query: 'Which markets moved the most today?' },
  { icon: Target, label: 'High Confidence', query: 'Find markets above 80%' },
  { icon: Clock, label: 'Ending Soon', query: 'Show markets ending this week' },
];

// Example conversation starters
const CONVERSATION_STARTERS = [
  "What's happening in crypto markets?",
  "Explain prediction markets to me",
  "Find undervalued opportunities",
  "Compare political markets",
  "What should I research today?",
];

// Parse user intent from natural language
function parseIntent(query: string, markets: Market[]): Message['data'] | null {
  const q = query.toLowerCase();
  
  // Category filters
  const categoryMap: Record<string, string[]> = {
    crypto: ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth', 'solana', 'altcoin'],
    politics: ['politic', 'trump', 'biden', 'election', 'president', 'senate', 'congress', 'vote'],
    sports: ['sport', 'nfl', 'nba', 'soccer', 'football', 'baseball', 'tennis', 'ufc', 'fight'],
    finance: ['stock', 'market', 'fed', 'interest rate', 'inflation', 'economy', 'recession'],
    entertainment: ['movie', 'oscar', 'grammy', 'celebrity', 'netflix', 'streaming'],
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => q.includes(k))) {
      const filtered = markets.filter(m => 
        m.category === category || 
        keywords.some(k => m.question.toLowerCase().includes(k))
      );
      if (filtered.length > 0) {
        return { type: 'markets', markets: filtered.slice(0, 8) };
      }
    }
  }
  
  // Price filters
  const aboveMatch = q.match(/(?:above|over|greater than|>|higher than)\s*(\d+)%?/);
  if (aboveMatch) {
    const threshold = parseInt(aboveMatch[1]) / 100;
    const filtered = markets.filter(m => (m.outcomes[0]?.price || 0) > threshold);
    return { type: 'markets', markets: filtered.slice(0, 10) };
  }
  
  const belowMatch = q.match(/(?:below|under|less than|<|lower than)\s*(\d+)%?/);
  if (belowMatch) {
    const threshold = parseInt(belowMatch[1]) / 100;
    const filtered = markets.filter(m => (m.outcomes[0]?.price || 0) < threshold);
    return { type: 'markets', markets: filtered.slice(0, 10) };
  }
  
  // Range filter
  const rangeMatch = q.match(/between\s*(\d+)%?\s*(?:and|to|-)\s*(\d+)%?/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1]) / 100;
    const high = parseInt(rangeMatch[2]) / 100;
    const filtered = markets.filter(m => {
      const price = m.outcomes[0]?.price || 0;
      return price >= low && price <= high;
    });
    return { type: 'markets', markets: filtered.slice(0, 10) };
  }
  
  // Top/trending/hot markets
  if (q.includes('top') || q.includes('trending') || q.includes('popular') || q.includes('hot') || q.includes('best')) {
    const sorted = [...markets].sort((a, b) => b.volume - a.volume);
    const count = parseInt(q.match(/\d+/)?.[0] || '5');
    return { type: 'markets', markets: sorted.slice(0, Math.min(count, 10)) };
  }
  
  // Biggest movers
  if (q.includes('move') || q.includes('change') || q.includes('volatile')) {
    const sorted = [...markets].sort((a, b) => 
      Math.abs(b.outcomes[0]?.priceChange24h || 0) - Math.abs(a.outcomes[0]?.priceChange24h || 0)
    );
    return { type: 'markets', markets: sorted.slice(0, 8) };
  }
  
  // High volume
  if (q.includes('volume') || q.includes('liquid') || q.includes('traded')) {
    const sorted = [...markets].sort((a, b) => b.volume - a.volume);
    return { type: 'markets', markets: sorted.slice(0, 10) };
  }
  
  // Undervalued/opportunities
  if (q.includes('undervalued') || q.includes('opportunit') || q.includes('mispriced') || q.includes('value')) {
    // Look for markets with low prices but high volume (potential opportunities)
    const opportunities = [...markets]
      .filter(m => (m.outcomes[0]?.price || 0) < 0.3 && m.volume > 10000)
      .sort((a, b) => b.volume - a.volume);
    return { 
      type: 'markets', 
      markets: opportunities.slice(0, 8),
    };
  }
  
  // Ending soon
  if (q.includes('ending') || q.includes('expire') || q.includes('deadline') || q.includes('soon')) {
    const now = new Date();
    const sorted = [...markets]
      .filter(m => new Date(m.endDate) > now)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    return { type: 'markets', markets: sorted.slice(0, 8) };
  }
  
  // Compare markets
  if (q.includes('compare') || q.includes('vs') || q.includes('versus')) {
    const compareMarkets: Market[] = [];
    if (q.includes('trump') || q.includes('biden')) {
      markets.forEach(m => {
        if (m.question.toLowerCase().includes('trump') || m.question.toLowerCase().includes('biden')) {
          compareMarkets.push(m);
        }
      });
    }
    if (compareMarkets.length > 0) {
      return { type: 'comparison', markets: compareMarkets.slice(0, 6) };
    }
  }
  
  // Explanation requests
  if (q.includes('explain') || q.includes('what is') || q.includes('how does') || q.includes('what are')) {
    return { 
      type: 'explanation',
      suggestions: [
        'How do prediction markets work?',
        'What does the price represent?',
        'How to read market signals?',
      ]
    };
  }
  
  // General keyword search
  const keywords = q.split(/\s+/).filter(w => w.length > 3);
  if (keywords.length > 0) {
    const filtered = markets.filter(m => {
      const question = m.question.toLowerCase();
      return keywords.some(k => question.includes(k));
    });
    if (filtered.length > 0) {
      return { type: 'markets', markets: filtered.slice(0, 10) };
    }
  }
  
  return null;
}

// Generate AI response
async function generateAIResponse(
  query: string,
  markets: Market[],
  parsedData: Message['data'] | null
): Promise<{ content: string; suggestions?: string[] }> {
  // If we have parsed data, generate a contextual response
  if (parsedData?.markets && parsedData.markets.length > 0) {
    const count = parsedData.markets.length;
    const topMarket = parsedData.markets[0];
    const avgPrice = parsedData.markets.reduce((sum, m) => sum + (m.outcomes[0]?.price || 0), 0) / count;
    
    if (parsedData.type === 'comparison') {
      return {
        content: `📊 Found ${count} markets for comparison. Average probability: ${(avgPrice * 100).toFixed(0)}%. The leading market is "${topMarket.question}" at ${formatPrice(topMarket.outcomes[0]?.price || 0.5)}.`,
        suggestions: ['Show me more details', 'What affects these markets?', 'Find related markets'],
      };
    }
    
    const priceDesc = avgPrice > 0.7 ? 'high confidence' : avgPrice < 0.3 ? 'low confidence' : 'moderate confidence';
    
    return {
      content: `🎯 Found ${count} matching markets with ${priceDesc} (avg ${(avgPrice * 100).toFixed(0)}%). Top result: "${topMarket.question}" trading at ${formatPrice(topMarket.outcomes[0]?.price || 0.5)} with ${formatCompactNumber(topMarket.volume)} volume.`,
      suggestions: ['Analyze this further', 'Find similar markets', 'What\'s the risk?'],
    };
  }
  
  if (parsedData?.type === 'explanation') {
    return {
      content: `📚 Great question! Here's a quick primer:\n\n**Prediction markets** let you trade on future outcomes. The price represents the crowd's estimated probability - if a market trades at 70¢, the crowd thinks there's a ~70% chance it happens.\n\n**Key insight**: When you think the crowd is wrong, that's your trading opportunity!`,
      suggestions: ['Show me examples', 'How do I start?', 'What markets are interesting?'],
    };
  }
  
  // Try to call OpenRouter for a more sophisticated response
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, marketContext: markets.slice(0, 5) }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        content: data.response,
        suggestions: ['Tell me more', 'Show related markets', 'What should I watch?'],
      };
    }
  } catch (error) {
    console.error('[Chat] AI response error:', error);
  }
  
  // Smart fallback responses
  if (query.toLowerCase().includes('help')) {
    return {
      content: `👋 I can help you explore prediction markets! Try asking:\n\n• **"Hot markets"** - See what's trending\n• **"Crypto above 60%"** - Filter by topic and price\n• **"Biggest movers today"** - Find volatile markets\n• **"Compare Trump vs Biden"** - Side-by-side analysis\n• **"Explain prediction markets"** - Learn the basics`,
      suggestions: ['Show hot markets', 'Find opportunities', 'Explain how this works'],
    };
  }
  
  return {
    content: `🤔 I couldn't find specific markets for "${query}". Try being more specific, or use filters like:\n\n• Topics: crypto, politics, sports\n• Price: "above 70%", "below 30%"\n• Activity: "trending", "high volume"`,
    suggestions: ['Show all markets', 'What\'s trending?', 'Help me search'],
  };
}

export function NaturalLanguageInterface({ markets, className = '', onMarketSelect }: NaturalLanguageInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show welcome message on mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `👋 **Hey there!** I'm your market research assistant.\n\nI can help you discover markets, analyze trends, and find opportunities. Try the quick actions below or ask me anything!`,
      timestamp: new Date(),
      data: {
        type: 'suggestion',
        suggestions: CONVERSATION_STARTERS,
      },
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (customQuery?: string) => {
    const query = customQuery || input.trim();
    if (!query || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Parse intent from query
      const parsedData = parseIntent(query, markets);
      
      // Generate AI response
      const { content, suggestions } = await generateAIResponse(query, markets, parsedData);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        data: parsedData ? {
          ...parsedData,
          suggestions,
        } : {
          type: 'suggestion',
          suggestions,
        },
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "😅 Oops! Something went wrong. Let me try that again...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, markets]);

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform group"
        >
          <Sparkles size={24} className="text-white group-hover:animate-pulse" />
        </button>
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-bullish rounded-full flex items-center justify-center text-xs text-white font-bold animate-bounce">
          ?
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={`${isExpanded ? 'fixed inset-4 z-50' : ''} ${className}`}
    >
      <Card 
        padding="none" 
        className={`flex flex-col bg-surface/95 backdrop-blur-xl border-border shadow-2xl ${
          isExpanded ? 'h-full' : 'h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  Market Assistant
                  <Badge variant="success" className="text-xs">AI</Badge>
                </h3>
                <p className="text-xs text-text-secondary">Ask anything about markets</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-b border-border bg-surface-elevated/50">
            <p className="text-xs text-text-secondary mb-2 font-medium">Quick Actions</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.query)}
                  className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-bullish/10 border border-border hover:border-bullish/50 rounded-lg text-xs text-text-secondary hover:text-bullish transition-all flex-shrink-0"
                >
                  <action.icon size={14} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] ${
                    message.role === 'user'
                      ? 'bg-bullish text-white rounded-2xl rounded-br-md'
                      : 'bg-surface-elevated rounded-2xl rounded-bl-md'
                  } p-4`}
                >
                  {/* Message content with markdown-style formatting */}
                  <div className={`text-sm whitespace-pre-wrap ${
                    message.role === 'user' ? 'text-white' : 'text-text-primary'
                  }`}>
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.split('**').map((part, j) => 
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>
                  
                  {/* Render market results */}
                  {message.data?.markets && message.data.markets.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {message.data.markets.map((market) => (
                        <motion.div
                          key={market.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 bg-background rounded-xl border border-border hover:border-bullish/50 transition-all cursor-pointer group"
                          onClick={() => onMarketSelect?.(market)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-bullish transition-colors">
                                {market.question}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {market.category}
                                </Badge>
                                <span className="text-xs text-text-secondary flex items-center gap-1">
                                  <DollarSign size={10} />
                                  {formatCompactNumber(market.volume)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-bullish">
                                {formatPrice(market.outcomes[0]?.price || 0.5)}
                              </p>
                              <p className={`text-xs flex items-center justify-end gap-1 ${
                                (market.outcomes[0]?.priceChange24h || 0) >= 0 ? 'text-bullish' : 'text-bearish'
                              }`}>
                                {(market.outcomes[0]?.priceChange24h || 0) >= 0 ? (
                                  <TrendingUp size={10} />
                                ) : (
                                  <TrendingDown size={10} />
                                )}
                                {((market.outcomes[0]?.priceChange24h || 0) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <Link 
                            href={`/market/${encodeURIComponent(market.id)}`}
                            className="mt-2 text-xs text-bullish hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View full analysis <ArrowRight size={10} />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Render suggestions */}
                  {message.data?.suggestions && message.data.suggestions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.data.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 bg-background hover:bg-bullish/10 border border-border hover:border-bullish/50 rounded-full text-xs text-text-secondary hover:text-bullish transition-all flex items-center gap-1"
                        >
                          <Zap size={10} />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-40 mt-3">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-surface-elevated rounded-2xl rounded-bl-md p-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-bullish rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-bullish rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-bullish rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Analyzing markets...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-surface-elevated/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about markets, trends, or opportunities..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-bullish/50 focus:ring-2 focus:ring-bullish/20 transition-all"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>
          <p className="text-xs text-text-secondary mt-2 text-center">
            Powered by AI • Real-time Polymarket data
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
