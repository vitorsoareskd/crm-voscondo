import { AgendaEvent, TipoRecorrencia } from '../types';

const formatRRule = (recorrencia: TipoRecorrencia, dataFinal?: string): string[] | undefined => {
  if (recorrencia === 'Nenhuma') return undefined;

  let freq = '';
  switch (recorrencia) {
    case 'Diária':
      freq = 'DAILY';
      break;
    case 'Semanal':
      freq = 'WEEKLY';
      break;
    case 'Mensal':
      freq = 'MONTHLY';
      break;
    case 'Anual':
      freq = 'YEARLY';
      break;
    default:
      return undefined;
  }

  let rrule = `RRULE:FREQ=${freq}`;

  if (dataFinal) {
    // Format YYYYMMDDTHHMMSSZ
    const cleanDate = dataFinal.replace(/-/g, '');
    rrule += `;UNTIL=${cleanDate}T235959Z`;
  }

  return [rrule];
};

export const syncEventToGoogle = async (
  event: AgendaEvent, 
  accessToken: string
): Promise<string> => {
  if (!accessToken) {
    throw new Error('Token de acesso do Google não fornecido.');
  }

  const startTime = new Date(event.dataHora);
  // Default duration 1 hour
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

  const recurrence = formatRRule(event.recorrencia, event.dataFinalRecorrencia);

  const eventPayload: any = {
    summary: event.titulo,
    description: `Condomínio: ${event.condominioNome || 'Geral'}\n${event.descricao || ''}\n[Cadastrado via VOS Condomínios CRM/ERP]`,
    location: event.condominioNome || 'VOS Condomínios',
    start: {
      dateTime: startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 7200 }, // 5 days (5 * 24 * 60 = 7200 min)
        { method: 'popup', minutes: 1440 }, // 1 day (24 * 60 = 1440 min)
        { method: 'popup', minutes: 120 },  // 2 hours (120 min)
      ],
    },
  };

  if (recurrence) {
    eventPayload.recurrence = recurrence;
  }

  // If already has googleEventId, update it (PUT)
  if (event.googleEventId) {
    const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (updateRes.ok) {
      const data = await updateRes.json();
      return data.id;
    }
    // If 404 (deleted remotely), continue to create new
    if (updateRes.status !== 404) {
      const errText = await updateRes.text();
      throw new Error(`Falha ao atualizar evento no Google Calendar: ${errText}`);
    }
  }

  // Create new event (POST)
  const createUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao criar evento no Google Calendar: ${errText}`);
  }

  const data = await response.json();
  return data.id;
};

export const deleteCalendarEvent = async (
  googleEventId: string,
  accessToken: string
): Promise<boolean> => {
  if (!accessToken || !googleEventId) return false;

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404;
  } catch (err) {
    console.warn('Erro ao remover evento do Google Calendar:', err);
    return false;
  }
};

export const syncAllAgendaEvents = async (
  events: AgendaEvent[],
  accessToken: string
): Promise<{ updatedEvents: AgendaEvent[]; countSuccess: number; countErrors: number }> => {
  let countSuccess = 0;
  let countErrors = 0;

  const updatedEvents: AgendaEvent[] = [];

  for (const event of events) {
    try {
      const gEventId = await syncEventToGoogle(event, accessToken);
      updatedEvents.push({
        ...event,
        googleEventId: gEventId,
      });
      countSuccess++;
    } catch (err) {
      console.error(`Erro ao sincronizar evento "${event.titulo}":`, err);
      updatedEvents.push(event);
      countErrors++;
    }
  }

  return { updatedEvents, countSuccess, countErrors };
};

export const generateGoogleCalendarWebUrl = (event: AgendaEvent): string => {
  const start = new Date(event.dataHora);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h

  const formatGCalDate = (d: Date): string => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
  const text = encodeURIComponent(event.titulo);
  const details = encodeURIComponent(
    `Condomínio: ${event.condominioNome || 'Geral'}\n${event.descricao || ''}\n[VOS Condomínios]`
  );
  const location = encodeURIComponent(event.condominioNome || 'VOS Condomínios');

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;

  if (event.recorrencia && event.recorrencia !== 'Nenhuma') {
    let freq = 'DAILY';
    if (event.recorrencia === 'Semanal') freq = 'WEEKLY';
    if (event.recorrencia === 'Mensal') freq = 'MONTHLY';
    if (event.recorrencia === 'Anual') freq = 'YEARLY';

    let recur = `RRULE:FREQ=${freq}`;
    if (event.dataFinalRecorrencia) {
      const cleanDate = event.dataFinalRecorrencia.replace(/-/g, '');
      recur += `;UNTIL=${cleanDate}T235959Z`;
    }
    url += `&recur=${encodeURIComponent(recur)}`;
  }

  return url;
};

export const downloadIcsFile = (event: AgendaEvent): void => {
  const start = new Date(event.dataHora);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const formatIcsDate = (d: Date): string => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VOS Condominios//CRM ERP//PT',
    'BEGIN:VEVENT',
    `UID:${event.id}@voscondominios.com.br`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${event.titulo}`,
    `DESCRIPTION:${event.condominioNome} - ${event.descricao || ''}`,
    `LOCATION:${event.condominioNome || 'VOS Condomínios'}`,
  ];

  if (event.recorrencia && event.recorrencia !== 'Nenhuma') {
    let freq = 'DAILY';
    if (event.recorrencia === 'Semanal') freq = 'WEEKLY';
    if (event.recorrencia === 'Mensal') freq = 'MONTHLY';
    if (event.recorrencia === 'Anual') freq = 'YEARLY';
    let rrule = `RRULE:FREQ=${freq}`;
    if (event.dataFinalRecorrencia) {
      rrule += `;UNTIL=${event.dataFinalRecorrencia.replace(/-/g, '')}T235959Z`;
    }
    icsContent.push(rrule);
  }

  icsContent.push('END:VEVENT', 'END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
