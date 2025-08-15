<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
    [k: string]: unknown;
  }

  let { children, ...rest }: Props = $props();
</script>

<ul {...rest} class="cds--list--unordered">
  {@render children?.()}
</ul>
