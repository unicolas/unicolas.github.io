<script lang="ts">
  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();
</script>

<div class="image-wrapper">
  <img {src} {alt} />
</div>

<style lang="scss">
  .image-wrapper {
    overflow-x: auto;
  }
</style>
