<script lang="ts">
  import { ArrowRight } from 'carbon-icons-svelte';
  import { Description, Eyebrow, Heading, Tag, TagGroup } from '.';
  import type { Post } from '$lib/types';
  import { formattedDate } from '$lib/helpers';
  import { base } from '$app/paths';

  export let post: Post;
</script>

<a class="cds--tile cds--tile--clickable card" href="{base}/blog/{post.slug}">
  <div class="cds--tile-content content">
    <Eyebrow size="sm">{formattedDate(post.date)}</Eyebrow>
    <Heading size="sm">{post.title}</Heading>
    <TagGroup>
      {#each post.tags as tag}
        <Tag name={tag} />
      {/each}
    </TagGroup>
    <Description size="sm">{post.description}</Description>
    <ArrowRight size={20} class="cds--tile--icon" />
  </div></a
>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .card {
    display: flex;
    flex-direction: row;
    padding: 0;
    margin-top: spacing.$spacing-06;
    .content {
      flex-grow: 1;
      padding: spacing.$spacing-06;
    }
  }
</style>
