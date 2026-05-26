export const schemaTypes = [
  {
    name: 'post',
    title: 'Blog Post',
    type: 'document',
    fields: [
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
      { name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true } },
      { name: 'publishedAt', title: 'Published at', type: 'datetime' },
      { name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] },
    ],
  },
  {
    name: 'tour',
    title: 'Tour',
    type: 'document',
    fields: [
      { name: 'name', title: 'Tour Name', type: 'string' },
      { name: 'price', title: 'Price (USD)', type: 'number' },
      { name: 'description', title: 'Description', type: 'text' },
      { name: 'duration', title: 'Duration (Hours)', type: 'string' },
      { name: 'startTime', title: 'Start Time', type: 'string' },
    ],
  },
  {
    name: 'reel',
    title: 'Instagram Reel',
    type: 'document',
    fields: [
      { name: 'title', title: 'Label', type: 'string' },
      { name: 'url', title: 'Instagram URL', type: 'url' },
      { name: 'thumbnail', title: 'Placeholder Thumbnail', type: 'image' },
    ],
  }
];
