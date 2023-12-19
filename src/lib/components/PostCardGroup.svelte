<script lang="ts">
  import { base } from '$app/paths';
  import type { Post } from '$lib/types';
  import { ArrowRight } from 'carbon-icons-svelte';
  import { PostCard } from '.';

  export let posts: Post[];
</script>

<div class="card-group">
  <div class="cds--subgrid">
    {#each posts as post}
      <div
        class="cds--css-grid-column cds--sm:col-span-4 cds--md:col-span-6 cds--lg:col-span-5 card-container"
      >
        <PostCard {post} />
      </div>
    {/each}
  </div>
  <div class="show-more-link">
    <a href={`${base}/blog`} class="cds--link"
      >More posts<ArrowRight class="cds--link__icon" /></a
    >
  </div>
</div>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .card-group {
    margin-bottom: spacing.$spacing-06;
  }
  .card-container {
    display: flex;
  }
  .show-more-link {
    display: block;
    padding-top: spacing.$spacing-04;
  }
</style>
