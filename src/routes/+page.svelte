<script lang="ts">
  import { base } from '$app/paths';
  import { Heading, PostCardGroup, Tag, TagGroup } from '$lib/components';

  export let data;
</script>

<svelte:head>
  <title>Blog | Nicolás Urquiola</title>
</svelte:head>

<section>
  <Heading>Latest posts</Heading>
  <PostCardGroup posts={data.posts} />
  <Heading>Tags</Heading>
  <TagGroup>
    {#each data.tags as tag}
      <Tag href={`${base}/blog/tags/${tag}`} name={tag} />
    {/each}
  </TagGroup>
</section>
