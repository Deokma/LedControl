package modules

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os/exec"
	"sync"
)

// TODO not work, need remake
var (
	sirenMutex  sync.Mutex
	sirenActive bool
	sirenCh     chan struct{}
)
var wg sync.WaitGroup

func SirenHandler(c *gin.Context) {
	sirenMutex.Lock()
	defer sirenMutex.Unlock()

	// Check if the siren is currently active
	if sirenActive {
		// If active, stop the siren immediately
		stopSiren()
		wg.Wait() // Wait for the sirenMode goroutine to finish
		c.String(http.StatusOK, "Siren mode deactivated")
		return
	}

	// Close the old sirenCh if it exists
	if sirenCh != nil {
		close(sirenCh)
	}

	// Always create a new sirenCh
	sirenCh = make(chan struct{})
	wg.Add(1) // Add a wait group for the new goroutine
	go func() {
		// Set sirenActive to true before starting the siren
		sirenActive = true
		defer func() {
			// Set sirenActive to false after stopping the siren
			sirenActive = false
			wg.Done() // Signal that the goroutine is done
		}()

		// Start the siren mode
		sirenMode()
	}()

	c.String(http.StatusOK, "Siren mode activated")
}

// / Function to stop the siren mode
func stopSiren() {
	sirenMutex.Lock()
	defer sirenMutex.Unlock()

	// Check if the sirenCh is not nil and not closed
	if sirenCh != nil {
		close(sirenCh)
		sirenCh = nil       // Set sirenCh to nil after closing
		sirenActive = false // Set sirenActive to false
	}
}

// Function to run the siren mode in a separate goroutine
func sirenMode() {
	defer close(sirenCh)

	for {
		select {
		case <-sirenCh:
			return
		default:
			// Perform the action when siren is active (e.g., execute a command)
			cmd := exec.Command("python", "LEDController.py", "siren_mode")
			err := RunCommand(cmd)
			if err != nil {
				log.Fatal(err)
			}
		}
	}
}
