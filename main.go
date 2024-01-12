package main

import (
	"embed"
	"fmt"
	"github.com/gin-gonic/gin"
	webview "github.com/webview/webview_go"
	"html/template"
	"io/fs"
	"led-controll/modules"
	"log"
	"net/http"
	"time"
)

//go:embed static/*
var staticFiles embed.FS

//go:embed templates/*
var templateFiles embed.FS

func main() {
	// Run the C++ server in a separate goroutine
	go func() {
		modules.StartCppServer()
	}()

	router := gin.Default()

	// Connecting static files from the static folder
	staticFS, _ := fs.Sub(staticFiles, "static")
	router.StaticFS("/static", http.FS(staticFS))

	// Loading templates from the templates folder
	templatesFS, err := fs.Sub(templateFiles, "templates")
	if err != nil {
		log.Fatal(err)
	}
	tmpl, err := template.ParseFS(templatesFS, "*.html")
	if err != nil {
		log.Fatal(err)
	}
	router.SetHTMLTemplate(tmpl)

	// Run the main server
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{})
	})

	router.POST("/setcolor", modules.SetColorHandler)
	router.POST("/turnon", modules.TurnOnHandler)
	router.POST("/turnoff", modules.TurnOffHandler)
	router.POST("/siren", modules.SirenHandler)

	router.GET("/test", func(c *gin.Context) {
		// Send test data to the C++ method
		err := modules.SendDataToCpp("7e070503ff000010ef")
		if err != nil {
			fmt.Println("Error sending data to C++ server:", err)
			c.String(http.StatusInternalServerError, "Error sending data to C++ server")
			return
		}
		fmt.Println("Data sent successfully to C++ server")
		c.String(http.StatusOK, "Data sent successfully to C++ server")
	})

	port := 8086
	fmt.Printf("Server is running on http://localhost:%d\n", port)
	// Run the server
	go func() {
		router.Run(fmt.Sprintf("localhost:%d", port))
	}()

	time.Sleep(2 * time.Second)

	debug := true
	w := webview.New(debug)
	defer w.Destroy()
	w.SetTitle("LEDControl")
	w.SetSize(1000, 700, webview.HintFixed)
	w.Navigate("http://localhost:8086/")
	w.Run()
}
