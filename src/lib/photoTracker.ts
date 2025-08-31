// Photo usage tracker to prevent repetition
interface Photo {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  photographer: string;
  tags: string[];
}

class PhotoTracker {
  private usedPhotos: Set<string> = new Set();
  private allPhotoIds: string[] = [];

  constructor() {
    // Initialize from session storage to persist across page refreshes
    this.loadFromSession();
  }

  // Load used photos from session storage
  private loadFromSession() {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('photoTracker_usedPhotos');
        if (stored) {
          const photoIds = JSON.parse(stored);
          this.usedPhotos = new Set(photoIds);
        }
      } catch {
        console.log('Failed to load photo tracker from session storage');
      }
    }
  }

  // Save used photos to session storage
  private saveToSession() {
    if (typeof window !== 'undefined') {
      try {
        const photoIds = Array.from(this.usedPhotos);
        sessionStorage.setItem('photoTracker_usedPhotos', JSON.stringify(photoIds));
      } catch {
        console.log('Failed to save photo tracker to session storage');
      }
    }
  }

  // Reset tracker (useful for testing or daily reset)
  resetTracker() {
    this.usedPhotos.clear();
    this.saveToSession();
  }

  // Get photos that haven't been used yet
  getUnusedPhotos(photoDatabase: Photo[], count: number): Photo[] {
    // Filter out already used photos
    const unusedPhotos = photoDatabase.filter(photo => !this.usedPhotos.has(photo.id));
    
    // If we don't have enough unused photos, reset the tracker
    if (unusedPhotos.length < count) {
      console.log('Resetting photo tracker - all photos have been used');
      this.resetTracker();
      return photoDatabase.slice(0, count);
    }
    
    // Get random unused photos
    const shuffled = this.shuffleArray([...unusedPhotos]);
    const selectedPhotos = shuffled.slice(0, count);
    
    // Mark these photos as used
    selectedPhotos.forEach(photo => {
      this.usedPhotos.add(photo.id);
    });
    
    // Save to session storage
    this.saveToSession();
    
    return selectedPhotos;
  }

  // Get the count of used vs total photos
  getUsageStats(photoDatabase: Photo[]) {
    return {
      used: this.usedPhotos.size,
      total: photoDatabase.length,
      remaining: photoDatabase.length - this.usedPhotos.size
    };
  }

  // Fisher-Yates shuffle algorithm
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Check if a specific photo is used
  isPhotoUsed(photoId: string): boolean {
    return this.usedPhotos.has(photoId);
  }

  // Manually mark a photo as used (for admin purposes)
  markPhotoAsUsed(photoId: string) {
    this.usedPhotos.add(photoId);
  }

  // Get all used photo IDs
  getUsedPhotoIds(): string[] {
    return Array.from(this.usedPhotos);
  }
}

// Create a singleton instance
const photoTracker = new PhotoTracker();

export default photoTracker;
