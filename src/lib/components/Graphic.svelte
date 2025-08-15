<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="graphic-container">
  {@render children?.()}
</div>

<style lang="scss">
  .graphic-container {
    padding: 1rem 0;
    overflow-x: auto;
  }
</style>
