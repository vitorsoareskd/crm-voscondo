import { TarefaEquipe } from '../types';

const formatDueDate = (dateStr: string): string | undefined => {
  if (!dateStr) return undefined;
  try {
    // Google Tasks requires RFC 3339 timestamp formatted in UTC
    const date = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
};

export const createOrUpdateGoogleTask = async (
  task: TarefaEquipe,
  accessToken: string
): Promise<string> => {
  if (!accessToken) {
    throw new Error('Token de acesso do Google não fornecido.');
  }

  const taskPayload: any = {
    title: `[${task.prioridade}] ${task.titulo} - ${task.condominioNome}`,
    notes: `Condomínio: ${task.condominioNome}\nResponsável: ${task.atribuidoPara || 'Equipe VOS'}\nPrioridade: ${task.prioridade}\nPrazo: ${task.dataLimite}\n[Sincronizado via VOS Condomínios]`,
    status: task.concluida ? 'completed' : 'needsAction',
  };

  const due = formatDueDate(task.dataLimite);
  if (due) {
    taskPayload.due = due;
  }

  // Update existing Google Task if googleTaskId exists
  if (task.googleTaskId) {
    const updateUrl = `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${task.googleTaskId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    });

    if (updateRes.ok) {
      const data = await updateRes.json();
      return data.id;
    }

    // If 404 (deleted on Google Tasks), proceed to create a new one
    if (updateRes.status !== 404) {
      const errText = await updateRes.text();
      throw new Error(`Falha ao atualizar tarefa no Google Tasks: ${errText}`);
    }
  }

  // Create new task on Google Tasks
  const createUrl = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks';
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao criar tarefa no Google Tasks: ${errText}`);
  }

  const data = await response.json();
  return data.id;
};

export const updateGoogleTaskStatus = async (
  googleTaskId: string,
  completed: boolean,
  accessToken: string
): Promise<boolean> => {
  if (!accessToken || !googleTaskId) return false;

  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${googleTaskId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: completed ? 'completed' : 'needsAction',
        }),
      }
    );

    return response.ok;
  } catch (err) {
    console.warn('Erro ao atualizar status da tarefa no Google Tasks:', err);
    return false;
  }
};

export const deleteGoogleTask = async (
  googleTaskId: string,
  accessToken: string
): Promise<boolean> => {
  if (!accessToken || !googleTaskId) return false;

  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${googleTaskId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404;
  } catch (err) {
    console.warn('Erro ao remover tarefa do Google Tasks:', err);
    return false;
  }
};

export const syncAllTasksToGoogle = async (
  tasks: TarefaEquipe[],
  accessToken: string
): Promise<{ updatedTasks: TarefaEquipe[]; countSuccess: number; countErrors: number }> => {
  let countSuccess = 0;
  let countErrors = 0;

  const updatedTasks: TarefaEquipe[] = [];

  for (const task of tasks) {
    try {
      const gTaskId = await createOrUpdateGoogleTask(task, accessToken);
      updatedTasks.push({
        ...task,
        googleTaskId: gTaskId,
      });
      countSuccess++;
    } catch (err) {
      console.error(`Erro ao sincronizar tarefa "${task.titulo}":`, err);
      updatedTasks.push(task);
      countErrors++;
    }
  }

  return { updatedTasks, countSuccess, countErrors };
};
