<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<nav class="cds--header__nav">
  <ul class="cds--header__menu-bar">
    {@render children?.()}
  </ul>
</nav>
