export interface User {
  id: string
  name: string
  email: string
  building: string
  karma: number
  avatar_url?: string
  created_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string
  category: string
  image_url?: string
  status: 'available' | 'borrowed' | 'reserved'
  created_at: string
  owner?: User
}

export interface BorrowRequest {
  id: string
  item_id: string
  borrower_id: string
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  created_at: string
  item?: Item
  borrower?: User
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  item_id?: string
  message: string
  created_at: string
  sender?: User
  receiver?: User
  item?: Item
}

export interface Conversation {
  other_user: User
  last_message: string
  last_time: string
  item?: Item
}

export const CATEGORIES = ['Tools', 'Books', 'Sports', 'Home', 'Tech', 'Kitchen', 'Other']
