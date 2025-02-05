// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/tailwindcss'],
  plugins: ['~/plugins/supabase-auth.js'],
  runtimeConfig: {
    public: {
      supabaseMagicKey: process.env.SUPABASE_MAGIC_KEY,
      supabaseApiUrl: process.env.SUPABASE_API_URL,
      supabaseApiKey: process.env.SUPABASE_API_KEY,
      email: process.env.email,
      password: process.env.password,
    }
  },
})