import { beforeAll, describe, expect, it } from 'vitest'
import { router } from './router'

// jsdom has no scrolling; the router's scrollBehavior would only log noise.
beforeAll(() => {
  window.scrollTo = () => {}
})

async function land(path: string) {
  await router.push(path)
  const route = router.currentRoute.value
  return { name: route.name, path: route.path, params: route.params, query: route.query }
}

describe('routes', () => {
  it('opens on the globe', async () => {
    expect(await land('/')).toMatchObject({ name: 'globe', path: '/' })
  })

  it('keeps saved places one link away', async () => {
    expect(await land('/places')).toMatchObject({ name: 'places' })
  })

  it('sends links from when the globe lived at #/globe to the start page', async () => {
    expect(await land('/globe')).toMatchObject({ name: 'globe', path: '/' })
  })

  it('sends unknown addresses to the globe', async () => {
    expect(await land('/nowhere/at/all')).toMatchObject({ name: 'globe' })
  })

  it('still opens v1 bookmarks as forecasts, and broken ones on the globe', async () => {
    expect(await land('/location/Kyiv%20City/Kyiv?lat=50.45&lon=30.52')).toMatchObject({
      name: 'forecast',
      params: { lat: '50.45', lon: '30.52' },
      query: { name: 'Kyiv', region: 'Kyiv City' },
    })
    expect(await land('/location/Kyiv%20City/Kyiv')).toMatchObject({ name: 'globe' })
  })
})
