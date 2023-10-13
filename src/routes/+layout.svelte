<script>
  import '$lib/sass/global.scss';
  import { page } from '$app/stores';
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
  import { base } from '$app/paths';

  let open = false;
  $: menues = [
    {
      href: `${base}/blog`,
      active: $page.url.pathname.startsWith(`${base}/blog`),
      title: 'Blog'
    },
    {
      href: `${base}/about`,
      active: $page.url.pathname === `${base}/about`,
      title: 'About'
    }
  ];
</script>

<Header name="Nicolás Urquiola" bind:open>
  <HeaderMenu>
    {#each menues as entry}
      <HeaderMenuItem {...entry} />
    {/each}
  </HeaderMenu>
  <HeaderGlobal>
    <HeaderAction href="https://github.com/unicolas" icon={LogoGithub} />
    <HeaderAction
      href="https://www.linkedin.com/in/nicolas-urquiola/"
      icon={LogoLinkedin}
    />
    <HeaderAction
      href="{base}/feed.atom"
      icon={Rss}
      type="application/atom+xml"
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
  />
  <div
    class="cds--css-grid-column cds--sm:col-span-4 cds--md:col-span-6 cds--lg:col-span-10"
  >
    <slot />
  </div>
  <div
    class="cds--css-grid-column cds--sm:col-span-0 cds--md:col-span-1 cds--lg:col-span-3"
  />
</div>

<style lang="scss">
  @use '@carbon/styles/scss/spacing';

  .content-wrapper {
    padding-top: spacing.$spacing-05;
    padding-bottom: spacing.$spacing-05;
  }
</style>
