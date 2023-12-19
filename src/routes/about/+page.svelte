<script>
  import { Heading } from '$lib/components';
  import Link from '$lib/components/Link.svelte';
</script>

<svelte:head>
  <title>About | Nicolás Urquiola</title>
</svelte:head>

<Heading>Hi!</Heading>
<p>
  {"My name is Nicolás Urquiola and I'm a software developer from Argentina."}
  {"I'll drop some of my thoughts and ideas about programming here, but don't expect too much."}
  {"I'd rather be napping."}
</p>
<p>
  {'This blog is hosted on'}
  <Link href="https://github.com/unicolas/unicolas.github.io">GitHub</Link
  >{', if you want to submit an issue or leave a comment go there.'}
</p>
<p>
  Built using <Link href="https://svelte.dev">Svelte</Link> and <Link
    href="https://carbondesignsystem.com">Carbon Design System</Link
  >.
</p>
