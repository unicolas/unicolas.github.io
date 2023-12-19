<script lang="ts">
  export let size: 'md' | 'sm' = 'md';
</script>

<div class="heading {size === 'md' ? 'heading-md' : 'heading-sm'}">
  <slot />
</div>

<style lang="scss">
  @use '@carbon/styles/scss/type';
  @use '@carbon/styles/scss/spacing';

  .heading {
    padding-bottom: spacing.$spacing-02;
  }
  .heading-md {
    @include type.type-style('heading-07');
  }
  .heading-sm {
    @include type.type-style('heading-04');
  }
</style>
