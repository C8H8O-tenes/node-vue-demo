<template>
  <router-view />
</template>

<script setup>
</script>

<style>
:root {
  --arek-blue: #3342ae;
  --arek-blue-soft: #1296d8;
  --arek-blue-deep: #1f317f;
  --arek-text-strong: #24324a;
  --arek-text-body: #364152;
  --arek-text-muted: #667085;
  --arek-border: #d7dde8;
  --arek-font: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

body {
  margin: 0;
  font-family: var(--arek-font);
  color: var(--arek-text-body);
  background: #eef2f7;
}

#app {
  min-height: 100vh;
}
</style>
