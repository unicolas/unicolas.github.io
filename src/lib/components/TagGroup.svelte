<div class="tag-group">
  <slot />
</div>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .tag-group {
    display: inline-flex;
    gap: spacing.$spacing-02;
    padding-top: spacing.$spacing-03;
  }
  .tag-group:empty {
    padding-top: 0;
  }
</style>
