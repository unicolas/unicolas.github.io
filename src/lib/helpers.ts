import type { Post } from './types';

export const formattedDate = (date: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(
    new Date(date.replaceAll('-', '/'))
  );

export const lastUpdated = (posts: Post[]) =>
  posts.reduce((acc: string, post: Post) => {
    const date = post.updated ?? post.date;
    return new Date(date) > new Date(acc) ? date : acc;
  }, posts[0].date);
