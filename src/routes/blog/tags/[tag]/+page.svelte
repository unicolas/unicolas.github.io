<script lang="ts">
  import { Heading, PostList } from '$lib/components';

  export let data;
</script>

<svelte:head>
  <title>Blog: {data.tag} | Nicolás Urquiola</title>
</svelte:head>

<section>
  <Heading>Blog: {data.tag}</Heading>
  <PostList posts={data.posts} />
</section>
