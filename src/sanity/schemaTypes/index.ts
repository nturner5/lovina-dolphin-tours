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
      { name: 'excerpt', title: 'Excerpt (SEO Description)', type: 'text', rows: 3 },
      { name: 'author', title: 'Author Name', type: 'string' },
      {
        name: 'keyTakeaways',
        title: 'Key Takeaways (Sidebar Bullet Points)',
        type: 'array',
        of: [{ type: 'string' }],
        description: 'A brief list of bullet point summaries for the sidebar box.'
      },
      {
        name: 'tags',
        title: 'Tags / Categories',
        type: 'array',
        of: [{ type: 'string' }]
      },
      {
        name: 'faqs',
        title: 'Structured FAQs',
        type: 'array',
        of: [
          {
            type: 'object',
            name: 'faqItem',
            title: 'FAQ Item',
            fields: [
              { name: 'question', title: 'Question', type: 'string' },
              { name: 'answer', title: 'Answer', type: 'text', rows: 3 }
            ]
          }
        ]
      },
      {
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [
          { type: 'block' },
          {
            type: 'image',
            title: 'Inline Image',
            options: { hotspot: true },
            fields: [
              {
                name: 'alt',
                type: 'string',
                title: 'Alternative Text',
                description: 'Crucial for search engines and accessibility.'
              },
              {
                name: 'caption',
                type: 'string',
                title: 'Caption',
                description: 'Optional text displayed under the image.'
              }
            ]
          }
        ]
      },
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
