<template>
  <header class="top-shell">
    <div class="topbar">
      <RouterLink class="brand" :to="{ name: 'homepage' }">
        <div class="brand-mark" aria-hidden="true">A</div>
        <span class="brand-text">AREK</span>
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

const route = useRoute();
const router = useRouter();

const items = [
  { label: 'Home', to: { name: 'homepage' } },
  { label: 'Explore' },
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
}

.topbar {
  height: 72px;
  background: #fff;
  border-bottom: 1px solid #d9dee7;
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
  gap: 10px;
  min-width: 140px;
  text-decoration: none;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border: 2px solid #5f84a7;
  color: #5f84a7;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.brand-text {
  font-size: 27px;
  font-weight: 700;
  color: #0f3f76;
  letter-spacing: 0.5px;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 30px;
  min-width: 0;
}

.nav-link {
  position: relative;
  color: #1f2937;
  text-decoration: none;
  font-size: 16px;
  line-height: 72px;
  white-space: nowrap;
  padding: 0 2px;
}

.nav-link.active {
  color: #1f4f88;
  font-weight: 600;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: #2f8ddb;
}

.nav-link.disabled {
  cursor: default;
}

.avatar-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #7f97ae;
  background: #f8fafc;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.avatar-inner {
  font-size: 21px;
  line-height: 1;
  color: #35516f;
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
