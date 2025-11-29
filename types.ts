
export interface CardData {
  name: string;
  title: string;
  phone: string;
  email: string;
  company: string;
  tagline: string;
  address: string;
  website: string;
  description: string;
}

export interface ImageEditState {
  originalImage: string | null;
  currentImage: string | null;
  isProcessing: boolean;
  prompt: string;
}
