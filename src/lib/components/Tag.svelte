<script lang="ts">
  export let href: string | undefined = undefined;
  export let name: string;
</script>

{#if href}
  <a {href}
    ><span class="tag cds--tag cds--tag--outline cds--tag--interactive"
      >{name}</span
    ></a
  >
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
