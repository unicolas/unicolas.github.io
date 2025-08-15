<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
    [k: string]: unknown;
  }

  let { children, ...rest }: Props = $props();
</script>

<li {...rest} class="cds--list__item">
  {@render children?.()}
</li>
