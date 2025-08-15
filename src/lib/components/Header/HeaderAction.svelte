<script lang="ts">
  import type { CarbonIconProps } from 'carbon-icons-svelte';
  import type { Component } from 'svelte';

  interface Props {
    href: string;
    icon: Component<CarbonIconProps>;
    [key: string]: any
  }

  let { href, icon, ...rest }: Props = $props();

  const SvelteComponent = $derived(icon);
</script>

<a
  {href}
  {...rest}
  class="cds--header__action cds--btn cds--btn--primary cds--btn--icon-only"
  ><SvelteComponent size={20} /></a
>
