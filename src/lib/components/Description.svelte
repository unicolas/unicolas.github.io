<script lang="ts">
  export let size: 'md' | 'sm' = 'md';
</script>

<div class={size === 'md' ? 'description-md' : 'description-sm'}>
  <slot />
</div>

<style lang="scss">
  @use '@carbon/styles/scss/type';
  @use '@carbon/styles/scss/spacing';

  .description-md {
    @include type.type-style('body-compact-02');
    padding-top: spacing.$spacing-02;
    padding-bottom: spacing.$spacing-02;
  }
  .description-sm {
    @include type.type-style('body-compact-01');
    padding-top: spacing.$spacing-06;
    padding-bottom: spacing.$spacing-06;
  }
</style>
