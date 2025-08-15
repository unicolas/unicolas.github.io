<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    children?: Snippet;
  }

  let { open = false, children }: Props = $props();
</script>

<nav
  class="cds--side-nav__navigation cds--side-nav cds--side-nav--ux cds--side-nav--hidden"
  class:cds--side-nav--expanded={open}
>
  <ul class="cds--side-nav__header-navigation">
    {@render children?.()}
  </ul>
</nav>
