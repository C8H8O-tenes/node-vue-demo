<template>
  <div class="page">
    <topleader />

    <div class="contact-page">
      <div class="contact-card">
        <p>McWilliams School of Biomedical Informatics</p>
        <p>The University of Texas Health Science Center at Houston</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import topleader from '@/components/topleader.vue';
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #d8dde3;
}

.contact-page {
  min-height: calc(100vh - 76px);
  display: grid;
  place-items: center;
  background: #f5f7fb;
  padding: 24px;
}

.contact-card {
  width: min(900px, 100%);
  background: #ffffff;
  border: 1px solid #e6eaf2;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  color: #111827;
  font-size: 28px;
  line-height: 1.35;
  font-family: 'Times New Roman', Times, serif;
}

.contact-card p {
  margin: 0;
}
</style>
