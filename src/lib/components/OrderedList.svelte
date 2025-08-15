<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
    [k: string]: unknown;
  }

  let { children, ...rest }: Props = $props();
</script>

<ol {...rest} class="cds--list--ordered">
  {@render children?.()}
</ol>
