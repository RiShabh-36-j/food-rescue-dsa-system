export type UrgencyTier = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'EXPIRED';

export type FoodCategory = 
  | 'Cooked Meals' 
  | 'Bakery' 
  | 'Fresh Produce' 
  | 'Dairy' 
  | 'Packaged Goods' 
  | 'Beverages';

export type DonationStatus = 
  | 'AVAILABLE' 
  | 'PARTIALLY_ALLOCATED' 
  | 'FULLY_ALLOCATED' 
  | 'EXPIRED' 
  | 'UNAVAILABLE' 
  | 'PENDING';

export interface Donation {
  id: string;
  food_name: string;
  category: FoodCategory | string;
  food_type: string;
  quantity: number;
  original_quantity: number;
  unit: string;
  donor_name: string;
  donor_location: string;
  expiry_time: string;
  expiry_epoch: number;
  created_at: string;
  storage_notes?: string;
  status: DonationStatus;
  description?: string;
  urgency_tier: UrgencyTier;
  hours_remaining: number;
}

export type RecipientPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecipientStatus = 'ACTIVE' | 'INACTIVE' | 'FULFILLED';

export interface Recipient {
  id: string;
  name: string;
  contact_person: string;
  phone?: string;
  location: string;
  accepted_categories: string[];
  required_quantity: number;
  current_demand: number;
  priority: RecipientPriority;
  people_served: number;
  status: RecipientStatus;
  created_at: string;
}

export interface Allocation {
  id: string;
  donation_id: string;
  recipient_id: string;
  food_name: string;
  donor_name: string;
  recipient_name: string;
  allocated_quantity: number;
  unit: string;
  route_distance_km: number;
  route_path: string;
  explanation: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  allocated_at: string;
}

export interface MatchCandidate {
  recipient: Recipient;
  route_distance_km: number;
  route_path: string[];
  proposed_quantity: number;
  match_reason: string;
  status: string;
}

export interface MatchRecommendation {
  donation: Donation;
  recipient: Recipient;
  allocated_quantity: number;
  remaining_donation_quantity: number;
  remaining_recipient_demand: number;
  route_distance_km: number;
  route_path: string;
  explanation: string;
  match_status: 'RECOMMENDED' | 'PARTIALLY_ALLOCATED' | 'NO_ELIGIBLE_RECIPIENT' | 'ROUTE_UNAVAILABLE';
}

export interface DashboardStats {
  total_donations: number;
  available_food_quantity: number;
  total_food_donated: number;
  total_food_allocated: number;
  donations_expiring_soon: number;
  successful_allocations: number;
  pending_donations: number;
  registered_recipients: number;
  allocation_success_rate: number;
  category_chart: Array<{ category: string; quantity: number }>;
  status_chart: Array<{ status: string; count: number }>;
  urgency_chart: Array<{ tier: string; count: number }>;
  urgent_donations: Donation[];
  recent_activity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface GraphNode {
  id: string;
  name: string;
  index: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  distance_km: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DijkstraStep {
  step_number: number;
  current_node: string;
  current_dist: number;
  action: 'INITIALIZE' | 'VISIT' | 'RELAX' | 'SKIP';
  examined_neighbor: string;
  edge_weight: number;
  old_dist: number | null;
  new_dist: number;
  relaxed: boolean;
  snapshot_distances: Record<string, number>;
}

export interface DijkstraResult {
  reachable: boolean;
  total_distance: number;
  path: string[];
  trace: DijkstraStep[];
}

export interface HeapTreeNode {
  index: number;
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  expiry_epoch: number;
  expiry_time: string;
  parent_index: number;
  left_child_index: number;
  right_child_index: number;
}

export interface HeapState {
  heap_size: number;
  is_empty: boolean;
  tree_nodes: HeapTreeNode[];
  complexity: Record<string, string>;
}

export interface HashTableBucket {
  bucket_index: number;
  entries: Array<{
    key: string;
    food_name: string;
    category: string;
    quantity: number;
  }>;
  entry_count: number;
}

export interface HashTableState {
  total_elements: number;
  bucket_count: number;
  load_factor: number;
  max_load_factor: number;
  buckets: HashTableBucket[];
  complexity: Record<string, string>;
}
