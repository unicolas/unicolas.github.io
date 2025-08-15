<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    size?: 'md' | 'sm';
    children?: Snippet;
  }

  let { size = 'md', children }: Props = $props();
</script>

<div class={size === 'md' ? 'description-md' : 'description-sm'}>
  {@render children?.()}
</div>

<style lang="scss">
  @use '@carbon/styles/scss/type';
  @use '@carbon/styles/scss/spacing';

  .description-md {
    @include type.type-style('body-compact-02');
    padding-top: spacing.$spacing-02;
    padding-bottom: spacing.$spacing-02;
  }
  .description-sm {
    @include type.type-style('body-compact-01');
    padding-top: spacing.$spacing-06;
    padding-bottom: spacing.$spacing-06;
  }
</style>
