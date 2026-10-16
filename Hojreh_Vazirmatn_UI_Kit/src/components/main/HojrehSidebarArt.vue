<script setup>
import sidebarArt from '../../assets/hojreh-sidebar-art.png'
</script>

<template>
  <!-- Illustration only: keep the existing functional logout button untouched. -->
  <div class="hj-sidebar-reference-art" aria-hidden="true">
    <img :src="sidebarArt" alt="" draggable="false" />
  </div>
</template>

<style scoped>
.hj-sidebar-reference-art {
  width: 100%;
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 0;
  pointer-events: none;
  overflow: hidden;
}
.hj-sidebar-reference-art img {
  display: block;
  width: min(100%, 187px);
  height: auto;
  object-fit: contain;
  user-select: none;
}
@media (max-width: 840px) {
  .hj-sidebar-reference-art { display: none; }
}
</style>
