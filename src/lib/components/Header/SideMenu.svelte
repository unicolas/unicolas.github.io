<script lang="ts">
  export let open = false;
</script>

<nav
  class="cds--side-nav__navigation cds--side-nav cds--side-nav--ux cds--side-nav--hidden"
  class:cds--side-nav--expanded={open}
>
  <ul class="cds--side-nav__header-navigation">
    <slot />
  </ul>
</nav>
