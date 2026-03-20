import crypto from 'crypto'

/**
 * Generate SHA-256 hash for any string input
 * Used for NID hashing and transaction integrity
 */
export function generateSHA256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Generate a unique transaction hash
 * Combines multiple data points for uniqueness
 */
export function generateTransactionHash(
  farmerId: string,
  dealerId: string,
  items: { fertilizerId: string; quantity: number }[],
  timestamp: Date,
  salt?: string
): string {
  const data = JSON.stringify({
    farmerId,
    dealerId,
    items: items.sort((a, b) => a.fertilizerId.localeCompare(b.fertilizerId)),
    timestamp: timestamp.toISOString(),
    salt: salt || crypto.randomBytes(16).toString('hex')
  })
  return generateSHA256(data)
}

/**
 * Generate QR code reference for farmers
 * Format: FR-{first 8 chars of NID hash}-{timestamp}
 */
export function generateQRReference(nationalIdHash: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const hashPrefix = nationalIdHash.substring(0, 8).toUpperCase()
  return `FR-${hashPrefix}-${timestamp}`
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(prefix: string = 'TXN'): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${year}${month}-${random}`
}

/**
 * Verify data integrity using hash comparison
 */
export function verifyIntegrity(data: string, hash: string): boolean {
  return generateSHA256(data) === hash
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Check if a location is within dealer's service area
 */
export function isWithinServiceArea(
  dealerLat: number,
  dealerLon: number,
  transactionLat: number,
  transactionLon: number,
  serviceRadius: number
): boolean {
  const distance = calculateDistance(dealerLat, dealerLon, transactionLat, transactionLon)
  return distance <= serviceRadius
}

/**
 * Simulate blockchain transaction recording
 * In production, this would interact with actual blockchain
 */
export async function simulateBlockchainRecord(
  transactionHash: string,
  data: Record<string, unknown>
): Promise<{
  success: boolean
  blockNumber?: number
  timestamp?: Date
  transactionHash: string
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  // Generate a simulated block number
  const blockNumber = Math.floor(Math.random() * 1000000) + 1000000
  
  return {
    success: true,
    blockNumber,
    timestamp: new Date(),
    transactionHash
  }
}

/**
 * Generate a deterministic hash for audit trail
 */
export function generateAuditHash(
  action: string,
  entityType: string,
  entityId: string,
  timestamp: Date,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): string {
  const data = JSON.stringify({
    action,
    entityType,
    entityId,
    timestamp: timestamp.toISOString(),
    oldValues: oldValues || null,
    newValues: newValues || null
  })
  return generateSHA256(data)
}

/**
 * Format hash for display (truncated)
 */
export function formatHash(hash: string, length: number = 16): string {
  if (hash.length <= length) return hash
  return `${hash.substring(0, length / 2)}...${hash.substring(hash.length - length / 2)}`
}

/**
 * Generate a verification code
 */
export function generateVerificationCode(length: number = 6): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length).toUpperCase()
}
