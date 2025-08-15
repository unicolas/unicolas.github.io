<script lang="ts">
  import { Close, Menu } from 'carbon-icons-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    open?: boolean;
    children?: Snippet;
  }

  let { name, open = $bindable(false), children }: Props = $props();

  const SvelteComponent = $derived(open ? Close : Menu);
</script>

<header class="cds--header">
  <button
    class="cds--header__action cds--header__menu-trigger cds--header__menu-toggle cds--header__menu-toggle__hidden"
    onclick={() => (open = !open)}
    aria-label={open ? 'Close menu' : 'Open menu'}
    ><SvelteComponent size={20} /></button
  >
  <a href="/" class="cds--header__name" style:padding="0 1rem">{name}</a>
  {@render children?.()}
  <div
    class="cds--side-nav__overlay"
    class:cds--side-nav__overlay-active={open}
></div>
</header>
