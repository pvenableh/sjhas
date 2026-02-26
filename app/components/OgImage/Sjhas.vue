<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "SJHAS, Inc.",
    description: "Accounting & Tax Services in Ithaca, NY",
  },
);
</script>

<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      background:
        'linear-gradient(135deg, #141e30 0%, #1a2c43 50%, #243b55 100%)',
      padding: '60px 80px',
      fontFamily: 'Avenir Next, Helvetica Neue, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Decorative ring (echoes the logo's circle motif) -->
    <div
      :style="{
        position: 'absolute',
        top: '-120px',
        right: '-120px',
        width: '440px',
        height: '440px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.06)',
      }"
    />
    <div
      :style="{
        position: 'absolute',
        top: '-80px',
        right: '-80px',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }"
    />

    <!-- Logo + site name -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '40px',
      }"
    >
      <img
        src="/icon-512x512.png"
        width="180"
        height="180"
        :style="{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
        }"
      />
      <!-- <div
        :style="{
          fontSize: '22px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.55)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }"
      >
        sjhas.com
      </div> -->
    </div>

    <!-- Title -->
    <div
      :style="{
        fontSize: '52px',
        fontWeight: '500',
        color: '#ffffff',
        lineHeight: '1.2',
        marginBottom: '16px',
        letterSpacing: '0.15em',
      }"
    >
      {{ title }}
    </div>

    <!-- Description -->
    <div
      :style="{
        fontSize: '24px',
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: '1.5',
      }"
    >
      {{ description }}
    </div>

    <!-- Bottom accent bar -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '4px',
        background:
          'linear-gradient(90deg, #3A6EA4 0%, #5A8BBE 50%, #3A6EA4 100%)',
      }"
    />
  </div>
</template>
