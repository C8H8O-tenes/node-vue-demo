<template>
  <header class="top-shell">
    <div class="topbar">
      <RouterLink class="brand" :to="{ name: 'homepage' }">
        <img class="brand-logo" :src="brandLogo" alt="AREK" />
      </RouterLink>

      <nav class="nav" aria-label="Primary">
        <template v-for="item in items" :key="item.label">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item) }"
          >
            {{ item.label }}
          </RouterLink>
          <span v-else class="nav-link disabled">
            {{ item.label }}
          </span>
        </template>
      </nav>

      <button class="avatar-btn" type="button" aria-label="Contact" @click="goContact">
        <span class="avatar-inner">i</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router';
import brandLogo from '@/assets/homepage-icons/AREK.png';

const route = useRoute();
const router = useRouter();

const items = [
  { label: 'Home', to: { name: 'homepage' } },
  { label: 'Explore', to: { name: 'explore' } },
  { label: 'Enterotype Explorer' },
  { label: 'Mechanism' },
  { label: 'Prediction Results' },
  { label: 'Docs' }
];

const isActive = (item) => Boolean(item.to && route.name === item.to.name);

const goContact = () => {
  router.push({ name: 'contact' });
};
</script>

<style scoped>
.top-shell {
  background: #d8dde3;
  padding: 14px 14px 0;
  font-family: var(--arek-font);
}

.topbar {
  height: 72px;
  background: #fff;
  border-bottom: 1px solid var(--arek-border);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 0 22px;
}

.brand {
  display: flex;
  align-items: center;
  min-width: 140px;
  text-decoration: none;
}

.brand-logo {
  height: 52px;
  width: auto;
  display: block;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 30px;
  min-width: 0;
}

.nav-link {
  position: relative;
  color: var(--arek-text-strong);
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  line-height: 72px;
  white-space: nowrap;
  padding: 0 2px;
}

.nav-link.active {
  color: var(--arek-blue);
  font-weight: 700;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: var(--arek-blue-soft);
}

.nav-link.disabled {
  cursor: default;
}

.avatar-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--arek-blue-soft);
  background: #f8fafc;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.avatar-inner {
  font-size: 21px;
  line-height: 1;
  color: var(--arek-blue-deep);
}

@media (max-width: 1100px) {
  .topbar {
    grid-template-columns: 1fr;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }

  .brand {
    justify-content: center;
  }

  .nav {
    flex-wrap: wrap;
    gap: 10px 20px;
  }

  .nav-link {
    line-height: 1.8;
  }

  .nav-link.active::after {
    bottom: -4px;
  }

  .avatar-btn {
    justify-self: center;
  }
}
</style>
