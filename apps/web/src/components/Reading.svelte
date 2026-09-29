<!--
  A reading: what is read, and its value, on one line in a card's details
  (the swing's percent, the key beside its notes).
-->
<script lang="ts">
  interface Props {
    label: string;
    value: string;
  }

  let { label, value }: Props = $props();
</script>

<div class="reading"><span>{label}</span><b>{value}</b></div>

<style>
  .reading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }
</style>
