<div
  {...$$restProps}
  class="blockquote cds--inline-notification cds--inline-notification--low-contrast cds--inline-notification--info-square"
>
  <div class="cds--inline-notification__details">
    <slot />
  </div>
</div>

<style lang="scss">
  .blockquote {
    max-width: unset;
  }
</style>
