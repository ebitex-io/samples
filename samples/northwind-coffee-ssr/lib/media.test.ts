import { describe, expect, it } from 'vitest'

import { documentExtension, formatFileSize, readMedia } from './media'

const asset = (externalId: string, content: Record<string, unknown>) => ({ contract: { externalId }, content })

describe('readMedia', () => {
  it('reads the sample image Contract: a Blob file and `alt`, no dimensions', () => {
    expect(readMedia({ contract: { externalId: 'image' }, content: { file: { url: '/b.jpg' }, alt: 'A bag' } })).toEqual({
      kind: 'image',
      url: '/b.jpg',
      alt: 'A bag',
      width: undefined,
      height: undefined,
    })
  })

  it('reads a Blob Image with alt-text and top-level dimensions', () => {
    expect(readMedia({ content: { file: { url: '/b.jpg' }, 'alt-text': 'Blob alt', width: 640, height: 360 } })).toMatchObject({
      alt: 'Blob alt',
      width: 640,
      height: 360,
    })
  })

  it('reads an Assets image: alt and dimensions inside file', () => {
    expect(readMedia(asset('ebitex-image', { kind: 'image', alt: 'Asset alt', file: { url: '/a.jpg', width: 1600, height: 900 } }))).toMatchObject({
      kind: 'image',
      alt: 'Asset alt',
      width: 1600,
      height: 900,
    })
  })

  it('gives an Assets image without dimensions none, and ignores top-level ones', () => {
    const read = readMedia(asset('ebitex-image', { alt: 'No size', width: 999, height: 999, file: { url: '/a.jpg', width: 0 } }))
    expect(read).toMatchObject({ width: undefined, height: undefined })
  })

  it('reads a video: manifest, poster and captions', () => {
    expect(readMedia(asset('ebitex-video', { name: 'Tour', file: { url: 'https://s/manifest/video.m3u8', posterUrl: 'https://s/p.jpg' } }))).toEqual({
      kind: 'video',
      src: 'https://s/manifest/video.m3u8',
      name: 'Tour',
      poster: 'https://s/p.jpg',
      captions: undefined,
    })
  })

  it('reads a document: name, extension and size', () => {
    expect(readMedia(asset('ebitex-document', { name: 'Guide', file: { url: 'https://s/guide.pdf', contentType: 'application/pdf', sizeBytes: 482113 } }))).toEqual({
      kind: 'document',
      url: 'https://s/guide.pdf',
      name: 'Guide',
      extension: 'PDF',
      sizeBytes: 482113,
    })
  })

  it('returns null without a file url or a value', () => {
    expect(readMedia(asset('ebitex-video', { name: 'x', file: {} }))).toBeNull()
    expect(readMedia(undefined)).toBeNull()
  })
})

describe('documentExtension and formatFileSize', () => {
  it('falls back to the content type, then to nothing', () => {
    expect(documentExtension('https://s/abc', 'application/pdf')).toBe('PDF')
    expect(documentExtension('https://s/abc', 'application/octet-stream')).toBeUndefined()
  })

  it('formats binary sizes and gives nothing for a missing one', () => {
    expect(formatFileSize(482113)).toBe('471 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(0)).toBe('')
  })
})
