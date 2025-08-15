<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
    [k: string]: unknown;
  }

  let { children, ...rest }: Props = $props();
</script>

<table {...rest} class="cds--data-table cds--data-table--md">
  {@render children?.()}
</table>
