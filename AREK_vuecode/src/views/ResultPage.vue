<template>
  <main class="wrap">
    <section class="card">
      <h1>AREK Result (Debug)</h1>
      <p class="muted">Current page only shows the search content passed from HomePage.</p>

      <div class="row"><span class="k">Keyword</span><span class="v">{{ q.keyword || '(empty)' }}</span></div>
      <div class="row"><span class="k">AREK Study Nr.</span><span class="v">{{ q.studyNr || '(all)' }}</span></div>
      <div class="row"><span class="k">Study subject</span><span class="v">{{ q.subject || '(all)' }}</span></div>
      <div class="row"><span class="k">Sample type</span><span class="v">{{ q.sampleType || '(all)' }}</span></div>

      <router-link to="/homepage" class="back">Back to HomePage</router-link>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const q = computed(() => ({
  keyword: route.query.keyword || '',
  studyNr: route.query.studyNr || '',
  subject: route.query.subject || '',
  sampleType: route.query.sampleType || ''
}));
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
}

.card {
  width: min(900px, 100%);
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

h1 {
  margin: 0 0 8px;
  color: #111827;
}

.muted {
  margin: 0 0 16px;
  color: #6b7280;
}

.row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #fbfdff;
  margin-bottom: 10px;
}

.k {
  font-weight: 600;
  color: #4b5563;
}

.v {
  color: #111827;
  word-break: break-word;
}

.back {
  display: inline-block;
  margin-top: 14px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
