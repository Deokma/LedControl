package modules

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func TurnOnHandler(c *gin.Context) {
	err := SendDataToCpp("7e0404f00001ff00ef")
	if err != nil {
		fmt.Println("Error sending data to C++ server:", err)
		c.String(http.StatusInternalServerError, "Error sending data to C++ server")
		return
	}
}

func TurnOffHandler(c *gin.Context) {
	err := SendDataToCpp("7e0404000000ff00ef")
	if err != nil {
		fmt.Println("Error sending data to C++ server:", err)
		c.String(http.StatusInternalServerError, "Error sending data to C++ server")
		return
	}
}
