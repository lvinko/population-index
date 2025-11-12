'use client';

import { Bell, BellOff } from 'lucide-react';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationButton = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        new Notification('Вітаємо!', {
          body: 'Тепер ви будете отримувати сповіщення про оновлення даних.',
          icon: '/logo.png'
        });

        toast.success('Сповіщення увімкнено!');
      } else if (result === 'denied') {
        toast.error('Сповіщення відхилено. Змініть налаштування браузера, щоб отримувати сповіщення.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Помилка при запиті дозволу на сповіщення');
    }
  };

  const handleClick = () => {
    if (!isSupported) {
      toast.error('Сповіщення не підтримуються в цьому браузері');
      return;
    }

    if (permission !== 'granted') {
      requestPermission();
    }

    if (permission === 'granted') {
      toast.success('Сповіщення увімкнено!');
    }
  }

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn-primary btn-sm ml-2"
      disabled={!isSupported}
    >
      {permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
    </button>
  );
};

export default NotificationButton; 