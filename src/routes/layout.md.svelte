<script>
  /** @type {{children?: import('svelte').Snippet}} */
  let { children } = $props();
</script>

<script module>
  import {
    Image as img,
    Link as a,
    List as li,
    UnorderedList as ul,
    OrderedList as ol,
    Blockquote as blockquote,
    Table as table
  } from '$lib/components';
  export { a, blockquote, img, li, ol, ul, table };
</script>

{@render children?.()}
