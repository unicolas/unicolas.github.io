<script lang="ts">
  export let href: string;
</script>

<a {href} class="cds--link heading"><slot /></a>

<style lang="scss">
  @use '@carbon/styles/scss/type';

  .heading {
    @include type.type-style('heading-06');
  }
</style>
