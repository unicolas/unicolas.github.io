<script lang="ts">
  import { base } from '$app/paths';
  import { Eyebrow, HeadingLink, Tag, TagGroup } from './';
  import { formattedDate } from '$lib/helpers';
  import type { Post } from '$lib/types';

  export let posts: Post[];
</script>

<ul class="posts">
  {#each posts as post}
    <li class="post">
      <Eyebrow>{formattedDate(post.date)}</Eyebrow>
      <HeadingLink href="{base}/blog/{post.slug}">{post.title}</HeadingLink>
      <TagGroup>
        {#each post.tags as tag}
          <Tag href={`${base}/blog/tags/${tag}`} name={tag} />
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
