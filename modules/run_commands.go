package modules

import (
	"os/exec"
	"sync"
)

var (
	cmdMutex sync.Mutex
)

func RunCommand(cmd *exec.Cmd) error {
	cmdMutex.Lock()
	defer cmdMutex.Unlock()

	return cmd.Run()
}
