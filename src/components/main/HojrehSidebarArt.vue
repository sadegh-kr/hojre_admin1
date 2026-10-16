<script setup>
import sidebarArt from '@/assets/hojreh-sidebar-art-transparent.png'
</script>

<template>
  <div class="sidebar-reference-art" aria-hidden="true">
    <img :src="sidebarArt" alt="" draggable="false" />
  </div>
</template>

<style scoped>
.sidebar-reference-art {
  width: 100%;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}

.sidebar-reference-art img {
  display: block;
  width: min(100%, 187px);
  height: auto;
  object-fit: contain;
  user-select: none;
  -webkit-mask-image: radial-gradient(
    ellipse 92% 92% at 50% 92%,
    #000 0%,
    #000 54%,
    rgba(0, 0, 0, .88) 68%,
    rgba(0, 0, 0, .42) 83%,
    transparent 100%
  );
  mask-image: radial-gradient(
    ellipse 92% 92% at 50% 92%,
    #000 0%,
    #000 54%,
    rgba(0, 0, 0, .88) 68%,
    rgba(0, 0, 0, .42) 83%,
    transparent 100%
  );
}

[data-theme='dark'] .sidebar-reference-art img {
  filter: brightness(.92) contrast(.9) saturate(.72);
  opacity: .82;
}

@media (max-width:900px), (max-height:720px) {
  .sidebar-reference-art { display:none; }
}
</style>
