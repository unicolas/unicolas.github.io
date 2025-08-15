<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="tag-group">
  {@render children?.()}
</div>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .tag-group {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: spacing.$spacing-02;
    padding-top: spacing.$spacing-03;
  }
  .tag-group:empty {
    padding-top: 0;
  }
</style>
