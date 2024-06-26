<div
  {...$$restProps}
  class="cds--inline-notification cds--inline-notification--low-contrast cds--inline-notification--blockquote"
>
  <div class="blockquote-details cds--inline-notification__details">
    <slot />
  </div>
</div>

<style lang="scss">
  .blockquote-details {
    display: inline-grid;
  }
</style>
