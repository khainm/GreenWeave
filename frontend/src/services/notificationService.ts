export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  // Subscribe to notifications
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Notify listeners
  private notify() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  // Add notification
  add(notification: Omit<Notification, 'id'>) {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    }

    this.notifications.push(newNotification)
    this.notify()

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, newNotification.duration)
    }

    return id
  }

  // Remove notification
  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notify()
  }

  // Clear all
  clear() {
    this.notifications = []
    this.notify()
  }

  // Convenience methods
  success(title: string, message?: string, duration?: number) {
    return this.add({ type: 'success', title, message, duration })
  }

  error(title: string, message?: string, duration?: number) {
    return this.add({ type: 'error', title, message, duration })
  }

  warning(title: string, message?: string, duration?: number) {
    return this.add({ type: 'warning', title, message, duration })
  }

  info(title: string, message?: string, duration?: number) {
    return this.add({ type: 'info', title, message, duration })
  }
}

export const notificationService = new NotificationService()
export default notificationService