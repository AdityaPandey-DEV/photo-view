'use client';

import { useState } from 'react';
import { X, Check, User } from 'lucide-react';

interface ProfileImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImage?: string;
}

const PROFILE_IMAGES = [
  {
    id: 'professional-1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    name: 'Professional Business',
    description: 'Clean, corporate look'
  },
  {
    id: 'professional-2',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    name: 'Modern Executive',
    description: 'Contemporary style'
  },
  {
    id: 'professional-3',
    url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    name: 'Friendly Professional',
    description: 'Approachable and warm'
  },
  {
    id: 'professional-4',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    name: 'Classic Professional',
    description: 'Timeless and reliable'
  }
];

export default function ProfileImageSelector({ isOpen, onClose, onSelect, currentImage }: ProfileImageSelectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImage || null);

  if (!isOpen) return null;

  const handleSelect = async (imageUrl: string) => {
    try {
      // Save profile image to MongoDB
      const response = await fetch('/api/auth/update-profile-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      if (response.ok) {
        console.log('Profile image saved to MongoDB:', imageUrl);
        setSelectedImage(imageUrl);
        onSelect(imageUrl);
        onClose();
      } else {
        console.error('Failed to save profile image to MongoDB');
        // Still select the image locally even if MongoDB save fails
        setSelectedImage(imageUrl);
        onSelect(imageUrl);
        onClose();
      }
    } catch (error) {
      console.error('Error saving profile image:', error);
      // Still select the image locally even if there's an error
      setSelectedImage(imageUrl);
      onSelect(imageUrl);
      onClose();
    }
  };

  return (
    <div className="profile-image-selector-overlay" onClick={onClose}>
      <div className="profile-image-selector" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <h3>Choose Profile Image</h3>
          <button className="close-btn" onClick={onClose}>
            <X className="icon" />
          </button>
        </div>
        
        <div className="images-grid">
          {PROFILE_IMAGES.map((image) => (
            <div 
              key={image.id} 
              className={`image-option ${selectedImage === image.url ? 'selected' : ''}`}
              onClick={() => setSelectedImage(image.url)}
            >
              <div className="image-container">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="profile-image"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-avatar');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="fallback-avatar">
                  <User className="icon" />
                </div>
                {selectedImage === image.url && (
                  <div className="selected-indicator">
                    <Check className="icon" />
                  </div>
                )}
              </div>
              <div className="image-info">
                <h4>{image.name}</h4>
                <p>{image.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="selector-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={() => selectedImage && handleSelect(selectedImage)}
            disabled={!selectedImage}
          >
            Use Selected Image
          </button>
        </div>
      </div>
    </div>
  );
}
