<script lang="ts">
  export let href: string;
  export let title: string;
  export let active = false;
</script>

<li>
  <a
    {href}
    class="cds--header__menu-item"
    class:cds--header__menu-item--current={active}>{title}</a
  >
</li>
