// NotificationContext.tsx - Context for header notifications
import React, { createContext, useContext, ReactNode } from 'react';

type NotificationType = 'success' | 'error';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a no-op function if context is not available (for backwards compatibility)
    return {
      showNotification: () => {},
    };
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  showNotification: (message: string, type?: NotificationType) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  showNotification,
}) => {
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
