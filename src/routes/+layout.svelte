<script lang="ts">
  import '$lib/sass/global.scss';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Rss, LogoGithub, LogoLinkedin } from 'carbon-icons-svelte';
  import {
    Header,
    HeaderAction,
    HeaderGlobal,
    HeaderMenu,
    HeaderMenuItem,
    SideMenu,
    SideMenuItem
  } from '$lib/components';
  import '@fontsource/ibm-plex-mono';
  import '@fontsource/ibm-plex-sans';
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }
  let { children } = $props();
  const paths = {
    blog: resolve('/blog'),
    about: resolve('/about'),
    feed: resolve('/feed.atom'),
  };
  let open = $state(false);
  let menues = $derived([
    {
      href: paths.blog,
      active: page.url.pathname.startsWith(paths.blog),
      title: 'Blog'
    },
    {
      href: paths.about,
      active: page.url.pathname === paths.about,
      title: 'About'
    }
  ]);
</script>

<Header name="Nicolás Urquiola" bind:open>
  <HeaderMenu>
    {#each menues as entry}
      <HeaderMenuItem {...entry} />
    {/each}
  </HeaderMenu>
  <HeaderGlobal>
    <HeaderAction
      href="https://github.com/unicolas"
      icon={LogoGithub}
      aria-label="My Github profile"
    />
    <HeaderAction
      href="https://www.linkedin.com/in/nicolas-urquiola/"
      icon={LogoLinkedin}
      aria-label="My linkedIn profile"
    />
    <HeaderAction
      href={paths.feed}
      icon={Rss}
      type="application/atom+xml"
      aria-label="Blog's Atom feed"
    />
  </HeaderGlobal>
  <SideMenu {open}>
    {#each menues as entry}
      <SideMenuItem {...entry} />
    {/each}
  </SideMenu>
</Header>

<div class="cds--css-grid content-wrapper">
  <div
    class="cds--css-grid-column cds--sm:col-span-0 cds--md:col-span-1 cds--lg:col-span-3"
></div>
  <div
    class="cds--css-grid-column cds--sm:col-span-4 cds--md:col-span-6 cds--lg:col-span-10"
  >
    {@render children?.()}
  </div>
  <div
    class="cds--css-grid-column cds--sm:col-span-0 cds--md:col-span-1 cds--lg:col-span-3"
></div>
</div>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .content-wrapper {
    padding-top: spacing.$spacing-05;
    padding-bottom: spacing.$spacing-05;
  }
</style>
