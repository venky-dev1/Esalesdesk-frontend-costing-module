<template>
  <q-layout view="lHh Lpr lff" >
    <q-header elevated style="background: linear-gradient(to left, white, #e0e2e4);">
      <q-toolbar>

        <q-btn
        flat
        round
        dense
        size="md"
        icon="menu"
        color="blue-grey-10"
        @click="drawerOpen = !drawerOpen"
      />

        <q-space />

        <q-btn
            dense
            round
            color="blue-grey-10"
            flat
            size="xs"
          >  
            <q-avatar square size="34px" icon="account_circle" />
            </q-btn>
      </q-toolbar>
    </q-header>
    <q-drawer side="left" bordered :width="200" v-model="drawerOpen" :breakpoint="200">
    </q-drawer>

    <q-page-container >
      <q-page class="q-pa-sm" >
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawerOpen = ref(false)



</script>