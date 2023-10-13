<script lang="ts">
  import { Heading, PostList } from '$lib/components';

  export let data;
</script>

<svelte:head>
  <title>Blog | Nicolás Urquiola</title>
</svelte:head>

<section>
  <Heading>Blog</Heading>
  <PostList posts={data.posts} />
</section>
