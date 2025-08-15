<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href: string;
    children?: Snippet;
  }

  let { href, children }: Props = $props();
</script>

<a {href} class="cds--link heading">{@render children?.()}</a>

<style lang="scss">
  @use '@carbon/styles/scss/type';

  .heading {
    @include type.type-style('heading-06');
  }
</style>
