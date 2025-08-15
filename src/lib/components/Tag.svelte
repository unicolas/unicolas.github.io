<script lang="ts">
  interface Props {
    href?: string | undefined;
    name: string;
  }

  let { href = undefined, name }: Props = $props();
</script>

{#if href}
  <a {href}><span class="tag cds--tag cds--tag--selectable">{name}</span></a>
{:else}
  <span class="tag cds--tag cds--tag--sm cds--layout--size-sm cds--tag--gray"
    >{name}</span
  >
{/if}

<style lang="scss">
  .tag:first-child {
    margin-left: 0;
  }
</style>
