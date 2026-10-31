export interface BookIndexEntry {
  lang: string;
  title: string;
  author: string;
  "Word Count": number;
  "Vocab Level"?: string;
  translated?: boolean | string;
  size?: string;
  [key: string]: unknown;
}
