<script lang="ts">
  import { base } from '$app/paths';
  import { Eyebrow, Heading, Tag, TagGroup } from '$lib/components';
  import { formattedDate } from '$lib/helpers';

  export let data;
</script>

<svelte:head>
  <title>{data.meta.title} | Nicolás Urquiola</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.meta.title} />
</svelte:head>

<article>
  <div class="heading-wrapper">
    <Eyebrow>{formattedDate(data.meta.date)}</Eyebrow>
    <Heading>{data.meta.title}</Heading>
    <TagGroup>
      {#each data.meta.tags as tag}
        <Tag href={`${base}/blog/tags/${tag}`} name={tag} />
      {/each}
    </TagGroup>
  </div>
  <div class="body-wrapper">
    <svelte:component this={data.content} />
  </div>
</article>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';
  .heading-wrapper {
    display: flex;
    flex-direction: column;
  }
</style>
