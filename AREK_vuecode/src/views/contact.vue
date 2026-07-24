<template>
  <div class="page">
    <topleader />

    <div class="contact-page">
      <div class="contact-card">
        <section class="contact-section">
          <h1>Principal investigators</h1>
          <article class="contact-person">
            <h2>Faraz Bishehsari, MD, PhD</h2>
            <a href="mailto:faraz.bishehsari@uth.tmc.edu">faraz.bishehsari@uth.tmc.edu</a>
            <p>McGovern Medical School, University of Texas Health Science Center at Houston, Houston, TX, USA</p>
          </article>
          <article class="contact-person">
            <h2>Xiaobo Zhou, Ph.D.</h2>
            <a href="mailto:Xiaobo.Zhou@uth.tmc.edu">Xiaobo.Zhou@uth.tmc.edu</a>
            <p>McWilliams School of Biomedical Informatics, University of Texas Health Science Center at Houston, Houston, TX, USA</p>
          </article>
        </section>

        <section class="contact-section">
          <h1>Co-investigators</h1>
          <article class="contact-person">
            <h2>Kexin Huang, Ph.D.</h2>
            <a href="mailto:Kexin.Huang@uth.tmc.edu">Kexin.Huang@uth.tmc.edu</a>
            <p>McWilliams School of Biomedical Informatics, University of Texas Health Science Center at Houston, Houston, TX, USA</p>
          </article>
          <article class="contact-person">
            <h2>Xiangsheng Huang, Ph.D.</h2>
            <a href="mailto:Xiangsheng.Huang@uth.tmc.edu">Xiangsheng.Huang@uth.tmc.edu</a>
            <p>McGovern Medical School, University of Texas Health Science Center at Houston, Houston, TX, USA</p>
          </article>
        </section>
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
  display: flex;
  justify-content: center;
  background: #f5f7fb;
  padding: 32px 24px;
}

.contact-card {
  width: min(900px, 100%);
  background: #ffffff;
  border: 1px solid #e6eaf2;
  border-radius: 10px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  color: #111827;
  font-family: var(--arek-font);
}

.contact-section + .contact-section {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid #e6eaf2;
}

.contact-section h1 {
  margin: 0;
  color: var(--arek-blue-deep);
  font-size: 28px;
  line-height: 1.2;
}

.contact-person {
  margin-top: 20px;
}

.contact-person h2 {
  margin: 0 0 6px;
  color: var(--arek-text-strong);
  font-size: 20px;
  line-height: 1.25;
}

.contact-person a {
  color: var(--arek-blue);
  font-weight: 700;
  text-decoration: none;
}

.contact-person a:hover {
  text-decoration: underline;
}

.contact-person p {
  margin: 8px 0 0;
  color: var(--arek-text-muted);
  font-size: 16px;
  line-height: 1.5;
}
</style>
