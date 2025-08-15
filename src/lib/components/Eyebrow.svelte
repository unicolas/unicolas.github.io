<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    size?: 'md' | 'sm';
    children?: Snippet;
  }

  let { size = 'md', children }: Props = $props();
</script>

<div class={size === 'md' ? 'eyebrow-md' : 'eyebrow-sm'}>{@render children?.()}</div>

<style lang="scss">
  @use '@carbon/styles/scss/type';

  .eyebrow-md {
    @include type.type-style('caption-02');
  }
  .eyebrow-sm {
    @include type.type-style('label-01');
  }
</style>
