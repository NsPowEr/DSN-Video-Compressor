//go:build !windows

package main

import (
	"os/exec"
)

func (a *App) configureCmd(cmd *exec.Cmd) {
	// Su Mac e Linux non serve fare nulla di speciale
	// per nascondere la finestra del terminale
}