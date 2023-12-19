<script lang="ts">
  export let size: 'md' | 'sm' = 'md';
</script>

<div class={size === 'md' ? 'eyebrow-md' : 'eyebrow-sm'}><slot /></div>

<style lang="scss">
  @use '@carbon/styles/scss/type';

  .eyebrow-md {
    @include type.type-style('caption-02');
  }
  .eyebrow-sm {
    @include type.type-style('label-01');
  }
</style>
