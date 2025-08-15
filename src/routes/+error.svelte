<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Heading } from '$lib/components';
  import { ArrowLeft } from 'carbon-icons-svelte';
</script>

<Heading
  ><span class="status">{page.status}</span> {page.error?.message}</Heading
>
<a href="{resolve('/')}" class="cds--link">
  Back to home
  <span class="cds--link__icon">
    <ArrowLeft />
  </span>
</a>

<style lang="scss">
  @use '@carbon/styles/scss/themes';
  @use '@carbon/styles/scss/theme' with (
    $theme: themes.$g90
  );

  .status {
    color: theme.$text-disabled;
  }
</style>
