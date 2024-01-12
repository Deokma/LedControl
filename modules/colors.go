package modules

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func SetColorHandler(c *gin.Context) {
	var jsonData map[string]string

	if err := c.ShouldBindJSON(&jsonData); err != nil {
		c.String(http.StatusBadRequest, "Invalid JSON format")
		return
	}
	color := jsonData["color"]
	if len(color) != 6 {
		c.String(http.StatusBadRequest, "Invalid color format")
		return
	}
	err := SendDataToCpp("7e070503" + color + "10ef")
	if err != nil {
		fmt.Println("Error sending data to C++ server:", err)
		c.String(http.StatusInternalServerError, "Error sending data to C++ server")
		return
	}
	fmt.Println("Data sent successfully to C++ server")
	c.String(http.StatusOK, "Data sent successfully to C++ server")
}
