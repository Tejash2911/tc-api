// Response Messages
const _messages = {
  // Error Messages
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation failed',
  DUPLICATE_ENTRY: 'Resource already exists',

  // Auth Messages
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Invalid credentials',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  EMAIL_SENT: 'Email sent successfully',
  PASSWORD_CHANGED: 'Password changed successfully',

  // User Messages
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',

  // Product Messages
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCT_QUANTITY_UPDATED: 'Product Quantity updated to Cart',
  OUT_OF_STOCK: 'Product is out of stock',

  // Address Messages
  ADDRESS_CREATED: 'Address created successfully',
  ADDRESS_UPDATED: 'Address updated successfully',
  ADDRESS_DELETED: 'Address deleted successfully',

  // Review Messages
  REVIEW_CREATED: 'Review created successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully',
  REVIEW_REPORTED: 'Review reported successfully',
  REVIEW_UPVOTED: 'Review upvoted successfully',
  ONLY_ONE_ALLOWED: 'Only one review is allowed per user',
  ONLY_ONE_REPORT: 'You can only report a review once',
  ONLY_ONE_UPVOTE: 'You can only upvote a review once',
  CAN_NOT_REPORT_OWN_REVIEW: 'You can not report your own review',
  CAN_NOT_UPVOTE_OWN_REVIEW: 'You can not upvote your own review',

  // Announcement Messages
  ANNOUNCEMENT_CREATED: 'Announcement created successfully',
  ANNOUNCEMENT_UPDATED: 'Announcement updated successfully',
  ANNOUNCEMENT_DELETED: 'Announcement deleted successfully',
  ANNOUNCEMENT_DISABLED: 'Announcement disabled successfully',
  ANNOUNCEMENT_ENABLED: 'Announcement enabled successfully',

  // Order Messages
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_DELETED: 'Order deleted successfully',
  ORDER_STATUS_UPDATED: 'Order status updated successfully'
}

export const messages = Object.freeze(_messages)
