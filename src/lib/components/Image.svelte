<script lang="ts">
  export let src: string;
  export let alt: string;
</script>

<div class="image-wrapper">
  <img {src} {alt} />
</div>

<style lang="scss">
  .image-wrapper {
    overflow-x: auto;
  }
</style>
