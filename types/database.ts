export type OrderStatus = 'pending' | 'confirmed' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          phone: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: {
          phone: string
          name: string
          address?: string | null
        }
        Update: {
          phone?: string
          name?: string
          address?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          category: string | null
          available: boolean
          created_at: string
        }
        Insert: {
          name: string
          price: number
          category?: string | null
          available?: boolean
        }
        Update: {
          name?: string
          price?: number
          category?: string | null
          available?: boolean
        }
        Relationships: []
      }
      flavors: {
        Row: {
          id: string
          name: string
          available: boolean
        }
        Insert: {
          name: string
          available?: boolean
        }
        Update: {
          name?: string
          available?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          customer_name: string | null
          status: OrderStatus
          total: number
          delivery_type: string | null
          delivery_address: string | null
          delivery_time: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          customer_id?: string | null
          customer_name?: string | null
          status?: OrderStatus
          total: number
          delivery_type?: string | null
          delivery_address?: string | null
          delivery_time?: string | null
          notes?: string | null
        }
        Update: {
          customer_id?: string | null
          customer_name?: string | null
          status?: OrderStatus
          total?: number
          delivery_type?: string | null
          delivery_address?: string | null
          delivery_time?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: []
      }
      order_item_flavors: {
        Row: {
          id: string
          order_item_id: string
          flavor_id: string
          quantity: number
        }
        Insert: {
          order_item_id: string
          flavor_id: string
          quantity: number
        }
        Update: {
          order_item_id?: string
          flavor_id?: string
          quantity?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      order_status: OrderStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type Customer = Database['public']['Tables']['customers']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Flavor = Database['public']['Tables']['flavors']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemFlavor = Database['public']['Tables']['order_item_flavors']['Row']

export type OrderWithDetails = Order & {
  customers: Customer | null
  order_items: (OrderItem & {
    products: Product
    order_item_flavors: (OrderItemFlavor & {
      flavors: Flavor
    })[]
  })[]
}
