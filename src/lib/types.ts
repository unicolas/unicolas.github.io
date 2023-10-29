export type Post = {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  published: boolean;
  updated?: string;
};

export type Paths = Record<string, { metadata?: Post }>;
