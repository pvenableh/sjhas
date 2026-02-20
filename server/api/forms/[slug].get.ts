export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const config = useRuntimeConfig()

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug is required' })
  }

  try {
    const response = await fetch(
      `${config.directus.url}/items/forms?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=id,title,slug,description,success_message,fields,allow_file_uploads,max_file_size_mb,allowed_file_types&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${config.directus.staticToken}`,
        },
      }
    )

    if (!response.ok) {
      throw createError({ statusCode: 500, message: 'Failed to fetch form' })
    }

    const result = await response.json()
    const form = result.data?.[0]

    if (!form) {
      throw createError({ statusCode: 404, message: 'Form not found' })
    }

    return form
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Failed to load form' })
  }
})
