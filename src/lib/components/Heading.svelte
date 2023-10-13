<div class="heading"><slot /></div>

<style lang="scss">
  @use '@carbon/styles/scss/type';
  @use '@carbon/styles/scss/spacing';

  .heading {
    @include type.type-style('heading-07');
    padding-bottom: spacing.$spacing-02;
  }
</style>
