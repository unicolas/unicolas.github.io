<script lang="ts">
  interface Props {
    href: string;
    title: string;
    active?: boolean;
  }

  let { href, title, active = false }: Props = $props();
</script>

<li>
  <a
    {href}
    class="cds--header__menu-item"
    class:cds--header__menu-item--current={active}>{title}</a
  >
</li>
