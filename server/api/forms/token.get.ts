// Issues a signed timestamp token that must accompany public form submissions
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { token: createFormToken() }
})
