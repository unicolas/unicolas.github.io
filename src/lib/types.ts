export type Post = {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  published: boolean;
};

export type Paths = Record<string, { metadata?: Post }>;
