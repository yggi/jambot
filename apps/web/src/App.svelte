<script lang="ts">
  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;
</script>

<main>
  <header>
    <h1>Jambot</h1>
    <p>You play, the Muse listens, the band answers.</p>
  </header>
  <p>
    The app is being ported from the prototype. Until then, the
    <a href={prototypeUrl}>prototype</a> is the playable version.
  </p>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 14px;
    display: grid;
    gap: 14px;
  }
  header p {
    color: var(--muted);
  }
  a {
    color: var(--amber);
  }
</style>
