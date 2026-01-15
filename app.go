package main

import (
	"bufio"
	"context"
	_ "embed"
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed executables/ffmpeg-win.exe
var ffmpegWin []byte

//go:embed executables/ffmpeg-mac
var ffmpegMac []byte

type App struct {
	ctx         context.Context
	cmdLock     sync.Mutex
	runningCmds map[*exec.Cmd]bool
	stopStats   chan bool
	ffmpegPath  string
}

type ProgressData struct {
	Filename string  `json:"filename"`
	Percent  float64 `json:"percent"`
}

type SystemStats struct {
	CPU float64 `json:"cpu"`
	RAM float64 `json:"ram"`
}

type ConversionResult struct {
	OutputPath string `json:"outputPath"`
	InputSize  string `json:"inputSize"`
	OutputSize string `json:"outputSize"`
}

func NewApp() *App {
	return &App{
		runningCmds: make(map[*exec.Cmd]bool),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.stopStats = make(chan bool)
	if err := a.setupFFmpeg(); err != nil {
		wailsRuntime.EventsEmit(a.ctx, "error", "Errore critico FFmpeg: "+err.Error())
		fmt.Println("Errore setup FFmpeg:", err)
	}
	go a.startSystemMonitoring()
}

func (a *App) shutdown(ctx context.Context) {
	if a.stopStats != nil {
		a.stopStats <- true
	}
	a.cmdLock.Lock()
	defer a.cmdLock.Unlock()
	for cmd := range a.runningCmds {
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
	}
}

func (a *App) setupFFmpeg() error {
	tempDir := os.TempDir()
	exeName := "ffmpeg"
	var data []byte

	switch runtime.GOOS {
	case "windows":
		exeName = "ffmpeg.exe"
		data = ffmpegWin
	case "darwin":
		exeName = "ffmpeg"
		data = ffmpegMac
	default:
		return fmt.Errorf("sistema operativo non supportato")
	}

	if len(data) == 0 {
		return fmt.Errorf("binario ffmpeg vuoto o mancante")
	}

	destPath := filepath.Join(tempDir, "video-compressor-bin", exeName)
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return err
	}

	info, err := os.Stat(destPath)
	if err == nil && info.Size() == int64(len(data)) {
		a.ffmpegPath = destPath
		if runtime.GOOS != "windows" {
			os.Chmod(destPath, 0755)
		}
		return nil
	}

	if err := os.WriteFile(destPath, data, 0755); err != nil {
		return fmt.Errorf("errore scrittura file: %v", err)
	}

	a.ffmpegPath = destPath
	return nil
}

func (a *App) startSystemMonitoring() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-a.stopStats:
			return
		case <-ticker.C:
			cpuPercent, _ := cpu.Percent(0, false)
			vMem, _ := mem.VirtualMemory()
			stats := SystemStats{CPU: 0, RAM: 0}
			if len(cpuPercent) > 0 {
				stats.CPU = math.Round(cpuPercent[0])
			}
			if vMem != nil {
				stats.RAM = math.Round(vMem.UsedPercent)
			}
			wailsRuntime.EventsEmit(a.ctx, "system:stats", stats)
		}
	}
}

func (a *App) formatFileSize(size int64) string {
	var suffixes [5]string
	suffixes[0] = "B"
	suffixes[1] = "KB"
	suffixes[2] = "MB"
	suffixes[3] = "GB"
	suffixes[4] = "TB"

	if size == 0 {
		return "0 B"
	}
	base := math.Log(float64(size)) / math.Log(1024)
	getSize := math.Ceil(base)
	if getSize >= float64(len(suffixes)) {
		getSize = float64(len(suffixes) - 1)
	}
	value := float64(size) / math.Pow(1024, getSize)
	return fmt.Sprintf("%.2f %s", value, suffixes[int(getSize)])
}

func (a *App) SelectFiles() []string {
	selection, err := wailsRuntime.OpenMultipleFilesDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleziona Video",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Video Files", Pattern: "*.mp4;*.mov;*.avi;*.mkv;*.flv;*.wmv;*.webm;*.mpeg;*.mpg"},
		},
	})
	if err != nil {
		return []string{}
	}
	return selection
}

func (a *App) OpenOutputFolder(path string) {
	dirToOpen := path
	fileInfo, err := os.Stat(path)
	if err == nil && !fileInfo.IsDir() {
		dirToOpen = filepath.Dir(path)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", dirToOpen)
	case "darwin":
		cmd = exec.Command("open", dirToOpen)
	default:
		return
	}

	// RICHIAMA LA FUNZIONE SPECIFICA PER OS
	a.configureCmd(cmd)

	cmd.Run()
}

// ConvertToMP4 accetta ora un parametro 'preset'
func (a *App) ConvertToMP4(inputPath string, preset string) (ConversionResult, error) {
	result := ConversionResult{OutputPath: "", InputSize: "", OutputSize: ""}

	if a.ffmpegPath == "" {
		if err := a.setupFFmpeg(); err != nil {
			return result, fmt.Errorf("FFmpeg mancante: %v", err)
		}
	}

	infoIn, err := os.Stat(inputPath)
	if err == nil {
		result.InputSize = a.formatFileSize(infoIn.Size())
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return result, fmt.Errorf("impossibile trovare cartella utente: %v", err)
	}

	outputDir := filepath.Join(homeDir, "Videos", "Converted")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return result, fmt.Errorf("impossibile creare cartella output: %v", err)
	}

	filename := filepath.Base(inputPath)
	ext := filepath.Ext(filename)
	baseName := filename[0 : len(filename)-len(ext)]
	// Aggiunge il preset al nome file per chiarezza, opzionale
	outputPath := filepath.Join(outputDir, baseName+"_"+preset+".mp4")

	durationSecs := a.getVideoDuration(a.ffmpegPath, inputPath)

	// Configurazione Base Default
	videoBitrate := "2527k"
	audioBitrate := "165k"
	fps := "30"
	scaleFilter := "" // vuoto significa risoluzione originale

	// Logica Preset
	switch preset {
	case "gaming_1080p30":
		videoBitrate = "5000k"
		audioBitrate = "192k"
		fps = "30"
		scaleFilter = "scale=1920:-2" // -2 mantiene aspect ratio e assicura divisibilità per 2
	case "gaming_1080p60":
		videoBitrate = "8000k"
		audioBitrate = "192k"
		fps = "60"
		scaleFilter = "scale=1920:-2"
	case "gaming_2k30":
		videoBitrate = "12000k"
		audioBitrate = "256k"
		fps = "30"
		scaleFilter = "scale=2560:-2"
	case "gaming_2k60":
		videoBitrate = "18000k"
		audioBitrate = "256k"
		fps = "60"
		scaleFilter = "scale=2560:-2"
	case "gaming_4k30":
		videoBitrate = "25000k"
		audioBitrate = "320k"
		fps = "30"
		scaleFilter = "scale=3840:-2"
	case "gaming_4k60":
		videoBitrate = "40000k"
		audioBitrate = "320k"
		fps = "60"
		scaleFilter = "scale=3840:-2"
	case "default":
		// Mantiene i valori di default definiti sopra
	default:
		// Fallback a default se stringa sconosciuta
	}

	// Costruzione argomenti FFmpeg
	args := []string{
		"-i", inputPath,
		"-b:v", videoBitrate,
		"-r", fps,
		"-b:a", audioBitrate,
		"-c:v", "libx264",
		"-c:a", "aac",
	}

	// Aggiungi filtro scala solo se necessario
	if scaleFilter != "" {
		args = append(args, "-vf", scaleFilter)
	}

	args = append(args,
		"-y",
		"-progress", "pipe:1",
		outputPath,
	)

	cmd := exec.CommandContext(a.ctx, a.ffmpegPath, args...)

	// RICHIAMA LA FUNZIONE SPECIFICA PER OS
	a.configureCmd(cmd)

	a.cmdLock.Lock()
	a.runningCmds[cmd] = true
	a.cmdLock.Unlock()

	defer func() {
		a.cmdLock.Lock()
		delete(a.runningCmds, cmd)
		a.cmdLock.Unlock()
	}()

	stdout, _ := cmd.StdoutPipe()
	if err := cmd.Start(); err != nil {
		return result, err
	}

	scanner := bufio.NewScanner(stdout)
	var lastPercent float64 = 0

	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "out_time_us=") {
			parts := strings.Split(line, "=")
			if len(parts) == 2 {
				currentUs, _ := strconv.ParseFloat(parts[1], 64)
				currentSecs := currentUs / 1000000
				if durationSecs > 0 {
					percent := (currentSecs / durationSecs) * 100
					if percent > 99 {
						percent = 99
					}
					if percent > lastPercent {
						lastPercent = percent
						wailsRuntime.EventsEmit(a.ctx, "conversion:progress", ProgressData{
							Filename: inputPath,
							Percent:  percent,
						})
					}
				}
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		if err.Error() == "signal: killed" {
			return result, fmt.Errorf("conversione interrotta dall'utente")
		}
		return result, fmt.Errorf("errore conversione: %v", err)
	}

	wailsRuntime.EventsEmit(a.ctx, "conversion:progress", ProgressData{
		Filename: inputPath,
		Percent:  100,
	})

	result.OutputPath = outputPath
	infoOut, err := os.Stat(outputPath)
	if err == nil {
		result.OutputSize = a.formatFileSize(infoOut.Size())
	}

	return result, nil
}

func (a *App) getVideoDuration(ffmpegPath, inputPath string) float64 {
	cmd := exec.Command(ffmpegPath, "-i", inputPath)

	// RICHIAMA LA FUNZIONE SPECIFICA PER OS
	a.configureCmd(cmd)

	output, _ := cmd.CombinedOutput()
	outputStr := string(output)

	re := regexp.MustCompile(`Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})`)
	matches := re.FindStringSubmatch(outputStr)

	if len(matches) == 5 {
		hours, _ := strconv.ParseFloat(matches[1], 64)
		mins, _ := strconv.ParseFloat(matches[2], 64)
		secs, _ := strconv.ParseFloat(matches[3], 64)
		return (hours * 3600) + (mins * 60) + secs
	}
	return 0
}