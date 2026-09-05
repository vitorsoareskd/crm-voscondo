import React, { useEffect } from 'react';
import { AgendaEvent } from '../types';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

export function useAgendaNotifications(
  agenda: AgendaEvent[],
  setAgenda: React.Dispatch<React.SetStateAction<AgendaEvent[]>>
) {
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      let hasChanges = false;
      const updatedAgenda = [...agenda];

      for (let i = 0; i < updatedAgenda.length; i++) {
        const evento = updatedAgenda[i];
        if (!evento.dataHora) continue;

        const eventDate = parseISO(evento.dataHora);
        
        // Skip events in the past
        if (eventDate < now) continue;

        const diffDays = differenceInDays(eventDate, now);
        const diffHours = differenceInHours(eventDate, now);

        let shouldUpdate = false;

        // 5 Days before
        if (diffDays <= 5 && diffDays > 1 && !evento.notificacaoEnviada5Dias) {
          showNotification(`Faltam 5 dias: ${evento.titulo}`, evento.condominioNome);
          updatedAgenda[i].notificacaoEnviada5Dias = true;
          shouldUpdate = true;
        }
        
        // 1 Day before
        if (diffDays <= 1 && diffHours > 2 && !evento.notificacaoEnviada1Dia) {
          showNotification(`Amanhã: ${evento.titulo}`, evento.condominioNome);
          updatedAgenda[i].notificacaoEnviada1Dia = true;
          shouldUpdate = true;
        }

        // 2 Hours before
        if (diffHours <= 2 && !evento.notificacaoEnviada2Horas) {
          showNotification(`Em breve (2h): ${evento.titulo}`, evento.condominioNome);
          updatedAgenda[i].notificacaoEnviada2Horas = true;
          shouldUpdate = true;
        }

        if (shouldUpdate) hasChanges = true;
      }

      if (hasChanges) {
        setAgenda(updatedAgenda);
      }
    };

    // Check immediately on mount, then every 1 minute
    checkNotifications();
    const intervalId = setInterval(checkNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [agenda, setAgenda]);

  const showNotification = (title: string, subtitle?: string) => {
    // Basic browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(title, { body: subtitle || 'Agenda do Condomínio' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: subtitle || 'Agenda do Condomínio' });
        }
      });
    }

    // Also dispatch a custom event to show an in-app toast if desired
    window.dispatchEvent(new CustomEvent('agenda-alert', { detail: { title, subtitle } }));
  };
}
