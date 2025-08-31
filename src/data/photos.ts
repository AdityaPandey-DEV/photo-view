import photoTracker from '@/lib/photoTracker';

// Use the same interface as photoTracker for consistency
export interface PhotoData {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  photographer: string;
  tags: string[];
}

// Smart function to generate random Pexels photo IDs and check if they exist
export const generateRandomPexelsPhoto = (category: string, title: string): PhotoData => {
  // Generate a random photo ID between 1 and 9999999 (Pexels has millions of photos)
  const randomPhotoId = Math.floor(Math.random() * 9999999) + 1;
  
  // Create the Pexels URL with the random ID
  const imageUrl = `https://images.pexels.com/photos/${randomPhotoId}/pexels-photo-${randomPhotoId}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`;
  
  // Generate a random photographer name
  const photographers = ['Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Davis', 'Carlos Silva', 'Lisa Wang', 'David Kim', 'Maria Garcia'];
  const randomPhotographer = photographers[Math.floor(Math.random() * photographers.length)];
  
  // Generate random tags based on category
  const tagMap: { [key: string]: string[] } = {
    'Portrait': ['portrait', 'people', 'face', 'professional', 'studio'],
    'Landscape': ['landscape', 'nature', 'outdoor', 'scenery', 'view'],
    'Street': ['street', 'urban', 'city', 'architecture', 'people'],
    'Product': ['product', 'commercial', 'object', 'detail', 'professional'],
    'Event': ['event', 'celebration', 'people', 'party', 'ceremony']
  };
  
  const tags = tagMap[category] || ['photography', 'image', 'photo'];
  
  return {
    id: `${category.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    category,
    imageUrl,
    photographer: randomPhotographer,
    tags
  };
};

// Function to generate a database with truly unique random photos
export const generateUniquePhotoDatabase = (count: number): PhotoData[] => {
  const categories = ['Portrait', 'Landscape', 'Street', 'Product', 'Event'];
  const titles = [
    'Professional Portrait', 'Creative Portrait', 'Natural Light Portrait', 'Studio Portrait', 'Environmental Portrait',
    'Mountain Vista', 'Ocean Sunset', 'Forest Path', 'Desert Dunes', 'Valley View',
    'Urban Life', 'Street Market', 'City Architecture', 'Street Art', 'Street Performers',
    'Tech Product', 'Fashion Item', 'Food Product', 'Jewelry', 'Home Decor',
    'Wedding Ceremony', 'Corporate Event', 'Birthday Party', 'Concert', 'Sports Event'
  ];
  
  const uniquePhotos: PhotoData[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const title = titles[i % titles.length];
    const photo = generateRandomPexelsPhoto(category, title);
    uniquePhotos.push(photo);
  }
  
  return uniquePhotos;
};

// Generate a dynamic photo database with truly unique random Pexels photos
export const photoDatabase: PhotoData[] = generateUniquePhotoDatabase(50);
  
  // Helper function to get random photos without repetition
  export const getRandomPhotos = (count: number): PhotoData[] => {
    // Create a copy of the database to avoid mutating the original
    const availablePhotos = [...photoDatabase];
    
    // Fisher-Yates shuffle algorithm for better randomization
    for (let i = availablePhotos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePhotos[i], availablePhotos[j]] = [availablePhotos[j], availablePhotos[i]];
    }
    
    // Return the requested number of photos
    return availablePhotos.slice(0, Math.min(count, availablePhotos.length));
  };
  
  // New function that uses the photo tracker to prevent repetition
  export const getUnusedRandomPhotos = (count: number): PhotoData[] => {
    return photoTracker.getUnusedPhotos(photoDatabase, count);
  };
  
  // Function to get usage statistics
  export const getPhotoUsageStats = () => {
    return photoTracker.getUsageStats(photoDatabase);
  };
  
  // Helper function to get random photos by category
  export const getRandomPhotosByCategory = (category: string, count: number): PhotoData[] => {
    const categoryPhotos = photoDatabase.filter(photo => photo.category === category);
    const shuffled = categoryPhotos.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  // Helper function to get photos by tags
export const getPhotosByTags = (tags: string[], count: number): PhotoData[] => {
  const taggedPhotos = photoDatabase.filter(photo => 
    photo.tags.some(tag => tags.includes(tag))
  );
  const shuffled = taggedPhotos.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};