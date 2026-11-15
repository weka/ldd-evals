// Command checkwebhook checks, before a release, that the alert webhook named
// in a config file accepts a POST.
package main

import (
	"context"
	"flag"
	"log"
	"os"

	"example.com/go-mini/internal/transport"
)

func main() {
	config := flag.String("config", "webhook.conf", "path of the webhook config file")
	flag.Parse()

	res, err := transport.CheckWebhook(context.Background(), *config, os.LookupEnv)
	if err != nil {
		log.Fatalf("webhook check: %v", err)
	}
	log.Printf("webhook check: status %d", res.Status)
}
