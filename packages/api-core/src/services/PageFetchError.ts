/** An upstream site that would not load. Answered as a 502: the caller's request was fine. */
export class PageFetchError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'PageFetchError';
    this.code = code;
  }
}
