<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/widgets/app-header/AppHeader.vue'
import SkyBackdrop from '@/widgets/sky-backdrop/SkyBackdrop.vue'
import AppFooter from '@/widgets/app-footer/AppFooter.vue'
import { focusPageHeading } from '@/shared/lib/focus'

const mainEl = ref<HTMLElement>()
</script>

<template>
  <a
    href="#main"
    class="sr-only z-50 rounded-full bg-ink px-4 py-2 font-medium text-[#2a1745] focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
    @click.prevent="focusPageHeading(mainEl)"
  >
    Skip to content
  </a>
  <SkyBackdrop />
  <AppHeader />
  <main id="main" ref="mainEl" tabindex="-1" class="w-full flex-1 outline-none">
    <RouterView v-slot="{ Component, route }">
      <!--
        The page width comes from the page being rendered, not the current route: during the
        out-in transition the old page fades out after the route has already changed, and it
        must keep its own layout (cards in the centred column) until it is gone.
      -->
      <Transition
        mode="out-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
      >
        <component
          :is="Component"
          :key="route.fullPath"
          :class="route.meta.fullBleed ? undefined : 'mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8'"
        />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />
</template>
