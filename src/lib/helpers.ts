export const formattedDate = (date: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(
    new Date(date.replaceAll('-', '/'))
  );
