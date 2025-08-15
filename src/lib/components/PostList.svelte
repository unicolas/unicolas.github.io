<script lang="ts">
  import { resolve } from '$app/paths';
  import { Description, Eyebrow, HeadingLink, Tag, TagGroup } from './';
  import { formattedDate } from '$lib/helpers';
  import type { Post } from '$lib/types';

  interface Props {
    posts: Post[];
  }

  let { posts }: Props = $props();
</script>

<ul class="posts">
  {#each posts as post}
    <li class="post">
      <Eyebrow>{formattedDate(post.date)}</Eyebrow>
      <HeadingLink href={resolve('/blog/[slug]', {slug: post.slug})}>{post.title}</HeadingLink>
      <Description>{post.description}</Description>
      <TagGroup>
        {#each post.tags as tag}
          <Tag href={resolve('/blog/tags/[tag]', {tag})} name={tag} />
        {/each}
      </TagGroup>
    </li>
  {/each}
</ul>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .posts {
    .post {
      list-style-type: none;
      display: flex;
      flex-direction: column;
      padding-bottom: spacing.$spacing-06;
      padding-top: spacing.$spacing-06;
    }
    .post:last-child {
      padding-bottom: 0;
    }
    padding: 0;
  }
</style>
