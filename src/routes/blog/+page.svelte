<script lang="ts">
  import { Heading, PostList } from '$lib/components';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Blog | Nicolás Urquiola</title>
</svelte:head>

<section>
  <Heading>Blog</Heading>
  <PostList posts={data.posts} />
</section>
