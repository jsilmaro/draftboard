export interface BriefTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  requirements: string;
  reward: number;
  amountOfWinners: number;
  deadline: string;
  isPrivate: boolean;
  additionalFields: Record<string, unknown>;
  rewardTiers: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
  }>;
}

export const briefTemplates: BriefTemplate[] = [
  {
    id: 'podcast-live-events',
    name: 'Podcast and Live Events',
    description: 'Create engaging content for podcasts and live streaming events',
    title: 'Podcast & Live Event Content Creation',
    requirements: '• Minimum 3 years experience in podcast production\n• Strong audio editing skills (Adobe Audition, Pro Tools)\n• Experience with live streaming platforms (Twitch, YouTube Live)\n• Ability to create engaging, original content\n• Portfolio of previous podcast/live event work\n• Available for live streaming during peak hours (7-9 PM EST)',
    reward: 2500,
    amountOfWinners: 3,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    additionalFields: {
      'Content Type': 'Podcast & Live Events',
      'Target Audience': 'Young adults (18-35)',
      'Content Length': '30-60 minutes per episode',
      'Platform': 'Spotify, Apple Podcasts, YouTube Live',
      'Style': 'Conversational, engaging, informative'
    },
    rewardTiers: [
      { position: 1, cashAmount: 1500, creditAmount: 0 },
      { position: 2, cashAmount: 750, creditAmount: 0 },
      { position: 3, cashAmount: 250, creditAmount: 0 }
    ]
  },
  {
    id: 'ecommerce-products',
    name: 'E-commerce & Products',
    description: 'Create compelling product content and marketing materials',
    title: 'E-commerce Product Content & Marketing',
    requirements: '• 2+ years experience in e-commerce content creation\n• Proficiency in product photography and video\n• Experience with Shopify, WooCommerce, or similar platforms\n• Strong copywriting skills for product descriptions\n• Knowledge of current e-commerce trends\n• Ability to create content that drives conversions',
    reward: 3000,
    amountOfWinners: 2,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    additionalFields: {
      'Content Type': 'Product Marketing',
      'Target Audience': 'Online shoppers (25-45)',
      'Content Format': 'Photos, videos, written content',
      'Platform': 'Website, social media, email marketing',
      'Style': 'Professional, conversion-focused'
    },
    rewardTiers: [
      { position: 1, cashAmount: 2000, creditAmount: 0 },
      { position: 2, cashAmount: 1000, creditAmount: 0 }
    ]
  },
  {
    id: 'social-media-campaigns',
    name: 'Social Media Campaigns',
    description: 'Create viral social media content across multiple platforms',
    title: 'Social Media Campaign Content',
    requirements: '• 3+ years experience in social media marketing\n• Proficiency in Instagram, TikTok, Twitter, LinkedIn\n• Strong visual design skills (Canva, Adobe Creative Suite)\n• Understanding of social media algorithms\n• Experience with influencer marketing\n• Ability to create trending, shareable content',
    reward: 2000,
    amountOfWinners: 4,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    additionalFields: {
      'Content Type': 'Social Media',
      'Target Audience': 'Gen Z and Millennials (18-35)',
      'Platforms': 'Instagram, TikTok, Twitter, LinkedIn',
      'Content Format': 'Images, videos, stories, reels',
      'Style': 'Trendy, engaging, shareable'
    },
    rewardTiers: [
      { position: 1, cashAmount: 800, creditAmount: 0 },
      { position: 2, cashAmount: 600, creditAmount: 0 },
      { position: 3, cashAmount: 400, creditAmount: 0 },
      { position: 4, cashAmount: 200, creditAmount: 0 }
    ]
  },
  {
    id: 'brand-storytelling',
    name: 'Brand Storytelling',
    description: 'Create compelling brand narratives and storytelling content',
    title: 'Brand Storytelling & Narrative Content',
    requirements: '• 4+ years experience in brand marketing\n• Strong storytelling and copywriting skills\n• Experience with video production and editing\n• Understanding of brand voice and messaging\n• Portfolio of successful brand campaigns\n• Ability to create emotional, memorable content',
    reward: 4000,
    amountOfWinners: 2,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    additionalFields: {
      'Content Type': 'Brand Storytelling',
      'Target Audience': 'Brand-conscious consumers (25-50)',
      'Content Format': 'Video, written content, visual storytelling',
      'Platform': 'Website, social media, advertising',
      'Style': 'Emotional, authentic, memorable'
    },
    rewardTiers: [
      { position: 1, cashAmount: 2500, creditAmount: 0 },
      { position: 2, cashAmount: 1500, creditAmount: 0 }
    ]
  },
  {
    id: 'educational-content',
    name: 'Educational Content',
    description: 'Create informative and educational content for learning platforms',
    title: 'Educational & Learning Content',
    requirements: '• Subject matter expertise in relevant field\n• Experience creating educational content\n• Strong presentation and communication skills\n• Knowledge of learning platforms (Udemy, Coursera, etc.)\n• Ability to break down complex topics\n• Experience with video production and editing',
    reward: 1800,
    amountOfWinners: 3,
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    isPrivate: false,
    additionalFields: {
      'Content Type': 'Educational',
      'Target Audience': 'Learners of all ages',
      'Content Format': 'Video lessons, written guides, interactive content',
      'Platform': 'Learning platforms, YouTube, website',
      'Style': 'Clear, informative, engaging'
    },
    rewardTiers: [
      { position: 1, cashAmount: 1000, creditAmount: 0 },
      { position: 2, cashAmount: 500, creditAmount: 0 },
      { position: 3, cashAmount: 300, creditAmount: 0 }
    ]
  }
];

export const getTemplateById = (id: string): BriefTemplate | undefined => {
  return briefTemplates.find(template => template.id === id);
};

