/**
 * The crawlers whose posture a reading reports.
 *
 * Every token here is a public string published by its operator, so unlike a
 * detection rule there is nothing here to keep off the wire: the value of the
 * report is the posture, not the roster.
 *
 * The list is deliberately short. An agent earns a row by being one whose
 * operator answers questions from what it fetched, because that is the whole
 * subject of this tool. A search crawler that only indexes is somebody else's
 * report.
 */
export interface KnownAgent {
  /** The token as robots.txt spells it. Matched case-insensitively. */
  readonly token: string;
  readonly operator: string;
  /** What blocking this one actually costs, for the copy around it. */
  readonly purpose: string;
}

export const KNOWN_AGENTS: readonly KnownAgent[] = Object.freeze([
  { token: 'GPTBot', operator: 'OpenAI', purpose: 'training and retrieval' },
  { token: 'OAI-SearchBot', operator: 'OpenAI', purpose: 'search results in ChatGPT' },
  { token: 'ChatGPT-User', operator: 'OpenAI', purpose: 'fetching a link a person pasted' },
  { token: 'ClaudeBot', operator: 'Anthropic', purpose: 'training and retrieval' },
  { token: 'Claude-SearchBot', operator: 'Anthropic', purpose: 'search results in Claude' },
  { token: 'Claude-User', operator: 'Anthropic', purpose: 'fetching a link a person pasted' },
  { token: 'PerplexityBot', operator: 'Perplexity', purpose: 'its index and citations' },
  { token: 'Perplexity-User', operator: 'Perplexity', purpose: 'fetching a link a person pasted' },
  { token: 'Google-Extended', operator: 'Google', purpose: 'Gemini and AI Overviews' },
  { token: 'Applebot-Extended', operator: 'Apple', purpose: 'Apple Intelligence' },
  { token: 'meta-externalagent', operator: 'Meta', purpose: 'Meta AI' },
  { token: 'Amazonbot', operator: 'Amazon', purpose: 'Alexa answers' },
  { token: 'CCBot', operator: 'Common Crawl', purpose: 'the corpus most models start from' },
  { token: 'Bytespider', operator: 'ByteDance', purpose: 'its assistant products' },
]);
