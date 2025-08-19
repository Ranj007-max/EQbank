type EventHandler = (data?: any) => void;

interface Events {
  [key: string]: EventHandler[];
}

const events: Events = {};

export const eventBus = {
  /**
   * Subscribe to an event.
   * @param eventName The name of the event to subscribe to.
   * @param handler The function to call when the event is dispatched.
   * @returns A function to unsubscribe.
   */
  subscribe: (eventName: string, handler: EventHandler): (() => void) => {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(handler);

    // Return an unsubscribe function
    return () => {
      eventBus.unsubscribe(eventName, handler);
    };
  },

  /**
   * Unsubscribe from an event.
   * @param eventName The name of the event.
   * @param handler The handler to remove.
   */
  unsubscribe: (eventName: string, handler: EventHandler): void => {
    if (!events[eventName]) {
      return;
    }
    const index = events[eventName].indexOf(handler);
    if (index > -1) {
      events[eventName].splice(index, 1);
    }
  },

  /**
   * Dispatch an event.
   * @param eventName The name of the event to dispatch.
   * @param data Optional data to pass to the handlers.
   */
  dispatch: (eventName: string, data?: any): void => {
    if (!events[eventName]) {
      return;
    }
    // Create a copy of the handlers array in case a handler unsubscribes itself
    const handlers = [...events[eventName]];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });
  },
};

// Define event names as constants to avoid typos
export const APP_EVENTS = {
  MCQ_UPDATED: 'mcqUpdated',
  SYNC_NEEDED: 'syncNeeded',
  // Add other app-wide events here
};
