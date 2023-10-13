import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { base } from '$app/paths';

export const load = (async () => {
  throw redirect(307, `${base}/blog`);
}) satisfies PageLoad;
