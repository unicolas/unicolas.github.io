<script lang="ts">
  import { resolve } from '$app/paths';
  import { Heading, PostCardGroup, Tag, TagGroup } from '$lib/components';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
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
      <Tag href={resolve('/blog/tags/[tag]', { tag })} name={tag} />
    {/each}
  </TagGroup>
</section>
