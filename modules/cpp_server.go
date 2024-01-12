package modules

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"syscall"
)

func StartCppServer() {
	// Define the path to the DLL
	dllPath := "LedLib.dll"

	// Load DLL
	dll, err := syscall.LoadLibrary(dllPath)
	if err != nil {
		log.Fatal("Ошибка при загрузке DLL:", err)
	}
	defer syscall.FreeLibrary(dll)

	// Getting the pointer to the exported function startServer
	startServer, err := syscall.GetProcAddress(dll, "startServer")
	if err != nil {
		log.Fatal("Ошибка при получении адреса функции:", err)
	}

	// Calling function startServer from DLL
	syscall.Syscall(uintptr(startServer), 0, 0, 0, 0)
	fmt.Println("C++ сервер запущен.")
}

func SendDataToCpp(data string) error {
	url := "http://localhost:25334" // Replace with your C++ server's URL

	// Create a JSON payload
	payload := []byte(fmt.Sprintf(`{"data": "%s"}`, data))

	// Make an HTTP POST request
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}
