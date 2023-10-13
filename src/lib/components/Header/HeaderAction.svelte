<script lang="ts">
  import type { CarbonIcon } from 'carbon-icons-svelte';

  export let href: string;
  export let icon: typeof CarbonIcon;
</script>

<a
  {href}
  {...$$restProps}
  class="cds--header__action cds--btn cds--btn--primary cds--btn--icon-only"
  ><svelte:component this={icon} size={20} /></a
>
