@echo off
:: ========================================================================
:: SCRIPT DE BACKUP DIARIO - BANCO DE DADOS SQLITE
:: ========================================================================

:: Define o diretorio onde o script esta sendo executado como raiz
set "RAIZ=%~dp0"
set "DB_ORIGEM=%RAIZ%database.sqlite"
set "PASTA_BACKUP=%RAIZ%backups"

:: Cria a pasta de backups se ela nao existir
if not exist "%PASTA_BACKUP%" (
    mkdir "%PASTA_BACKUP%"
    echo Pasta de backup criada em: %PASTA_BACKUP%
)

:: Verifica se o arquivo de banco de dados existe antes de tentar copiar
if not exist "%DB_ORIGEM%" (
    echo [ERRO] O banco de dados database.sqlite nao foi encontrado na raiz do projeto!
    echo Caminho procurado: %DB_ORIGEM%
    pause
    exit /b 1
)

:: Pega a data e hora atual do sistema (Formato Windows independente da regiao, usando WMI)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set ANO=%dt:~0,4%
set MES=%dt:~4,2%
set DIA=%dt:~6,2%
set HORA=%dt:~8,2%
set MIN=%dt:~10,2%
set SEG=%dt:~12,2%

:: Formata o nome do arquivo final, ex: backup_20231027_153022.sqlite
set "NOME_BACKUP=backup_%ANO%%MES%%DIA%_%HORA%%MIN%%SEG%.sqlite"
set "DESTINO=%PASTA_BACKUP%\%NOME_BACKUP%"

:: Copia o arquivo
copy "%DB_ORIGEM%" "%DESTINO%" > nul

if %ERRORLEVEL% equ 0 (
    echo [SUCESSO] Backup realizado com sucesso!
    echo Arquivo salvo em: %DESTINO%
) else (
    echo [ERRO] Ocorreu um erro ao tentar realizar o backup.
)

:: ========================================================================
:: COMO AGENDAR ESTE SCRIPT NO AGENDADOR DE TAREFAS DO WINDOWS
:: ========================================================================
:: 1. Pressione a tecla Windows e digite "Agendador de Tarefas".
:: 2. No menu a direita, clique em "Criar Tarefa Basica...".
:: 3. Nome: "Backup Diario Condominios" -> Avancar.
:: 4. Disparador: Escolha "Diariamente" -> Avancar.
:: 5. Defina o horario que deseja que o backup ocorra (ex: 23:00) -> Avancar.
:: 6. Acao: Escolha "Iniciar um programa" -> Avancar.
:: 7. Programa/script: Clique em "Procurar" e selecione este arquivo (backup_diario.bat).
:: 8. IMPORTANTE: No campo "Iniciar em (opcional)", cole o caminho da pasta raiz do seu projeto.
::    Exemplo: C:\Users\vitor\antigravity\VOS-Condominios---CRM-&-ERP\
:: 9. Clique em "Avancar" e depois em "Concluir".
:: ========================================================================
