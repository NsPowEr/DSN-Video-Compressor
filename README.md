# Video Converter App

## Info

Questo è il template ufficiale Wails React per l'applicazione Video Converter.

Puoi configurare il progetto modificando `wails.json`. Maggiori informazioni sulle impostazioni del progetto si trovano qui: https://wails.io/docs/reference/project-config

## Setup e Dipendenze

Prima di eseguire o compilare l'applicazione, è necessario fornire i binari di FFmpeg.

1.  **Crea una cartella** chiamata `executables` nella directory principale del progetto (se non esiste già).
2.  **Scarica FFmpeg** (versioni statiche) per le tue piattaforme:
    * **Windows:** Scarica il file `.exe` e rinominalo in `ffmpeg-win.exe`.
    * **macOS:** Scarica il binario e rinominalo in `ffmpeg-mac`. (Nota: Assicurati di concedere i permessi di esecuzione su macOS usando `chmod +x executables/ffmpeg-mac`).
3.  **Posiziona i file:** Sposta sia `ffmpeg-win.exe` che `ffmpeg-mac` nella cartella `executables/` che hai creato.

## Sviluppo Live

Per eseguire in modalità sviluppo live, esegui `wails dev` nella directory del progetto. Questo avvierà un server di sviluppo Vite che fornirà un hot reload molto veloce delle modifiche al frontend. Se vuoi sviluppare in un browser e avere accesso ai tuoi metodi Go, c'è anche un server di sviluppo in esecuzione su http://localhost:34115. Connettiti a questo indirizzo nel browser e potrai chiamare il tuo codice Go dai devtools.

## Compilazione (Build)

Per creare un pacchetto ridistribuibile in modalità produzione, usa `wails build`.

### Configurazione Firma macOS

Se stai compilando per macOS usando lo script `build.sh` fornito, devi configurare la tua Apple Signing Identity.

1.  Apri il terminale ed esegui il seguente comando per elencare le identità di firma disponibili:

    ```bash
    security find-identity -v -p codesigning
    ```

2.  Copia la stringa dell'identità (il testo tra virgolette, che solitamente inizia con "Apple Development:" o "Developer ID Application:").
3.  Apri il file `build.sh` nel tuo editor.
4.  Incolla la tua identità nella variabile `SIGNING_IDENTITY`.