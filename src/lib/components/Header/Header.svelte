<script lang="ts">
  import { Close, Menu } from 'carbon-icons-svelte';

  export let name: string;
  export let open = false;
</script>

<header class="cds--header">
  <button
    class="cds--header__action cds--header__menu-trigger cds--header__menu-toggle cds--header__menu-toggle__hidden"
    on:click={() => (open = !open)}
    ><svelte:component this={open ? Close : Menu} size={20} /></button
  >
  <a href="/" class="cds--header__name" style:padding="0 1rem">{name}</a>
  <slot />
  <div
    class="cds--side-nav__overlay"
    class:cds--side-nav__overlay-active={open}
  />
</header>
