import {
  createDirectus,
  rest,
  readItems,
  readItem,
  readSingleton,
  createItem,
  updateItem,
  uploadFiles,
  type DirectusClient,
  type RestClient,
} from '@directus/sdk'
import type { Collections } from '~/types/directus'

let directusClient: DirectusClient<Collections> & RestClient<Collections> | null = null

export const useDirectus = () => {
  const config = useRuntimeConfig()

  if (!directusClient) {
    directusClient = createDirectus<Collections>(config.public.directusUrl)
      .with(rest())
  }

  return directusClient
}

// Helper composables for common operations

export const useSiteSettings = async () => {
  const client = useDirectus()
  return await client.request(readSingleton('site_settings'))
}

export const useHomePage = async () => {
  const client = useDirectus()
  return await client.request(readSingleton('home_page'))
}

export const useServices = async () => {
  const client = useDirectus()
  return await client.request(
    readItems('services', {
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
    })
  )
}

export const useTestimonials = async (featured = false) => {
  const client = useDirectus()
  const filter: Record<string, unknown> = { status: { _eq: 'published' } }
  if (featured) {
    filter.featured = { _eq: true }
  }
  return await client.request(
    readItems('testimonials', {
      filter,
      sort: ['sort'],
    })
  )
}

export const useForm = async (slug: string) => {
  const client = useDirectus()
  const forms = await client.request(
    readItems('forms', {
      filter: {
        slug: { _eq: slug },
        status: { _eq: 'published' },
      },
      fields: ['*', { fields: ['*'] }],
      limit: 1,
    })
  )
  return forms[0] || null
}

export const usePage = async (slug: string) => {
  const client = useDirectus()
  const pages = await client.request(
    readItems('pages', {
      filter: {
        slug: { _eq: slug },
        status: { _eq: 'published' },
      },
      limit: 1,
    })
  )
  return pages[0] || null
}
