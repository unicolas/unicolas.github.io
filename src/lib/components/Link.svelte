<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href: string;
    children?: Snippet;
  }

  let { href, children }: Props = $props();
</script>

<a {href} class="cds--link cds--link--inline">
  {@render children?.()}
</a>
