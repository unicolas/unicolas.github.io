<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
    [k: string]: unknown;
  }

  let { children, ...rest }: Props = $props();
</script>

<div
  {...rest}
  class="cds--inline-notification cds--inline-notification--low-contrast cds--inline-notification--blockquote"
>
  <div class="blockquote-details cds--inline-notification__details">
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .blockquote-details {
    display: inline-grid;
  }
</style>
