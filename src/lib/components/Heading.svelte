<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    size?: 'md' | 'sm';
    children?: Snippet;
  }

  let { size = 'md', children }: Props = $props();
</script>

<div class="heading {size === 'md' ? 'heading-md' : 'heading-sm'}">
  {@render children?.()}
</div>

<style lang="scss">
  @use '@carbon/styles/scss/type';
  @use '@carbon/styles/scss/spacing';

  .heading {
    padding-bottom: spacing.$spacing-02;
  }
  .heading-md {
    @include type.type-style('heading-07');
  }
  .heading-sm {
    @include type.type-style('heading-04');
  }
</style>
