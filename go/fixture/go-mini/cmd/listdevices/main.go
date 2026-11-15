// Command listdevices prints the ids of the stored devices whose tags match a
// filter, for example "region:eu,!retired".
package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"example.com/go-mini/internal/repository"
	"example.com/go-mini/internal/tagfilter"
)

func main() {
	store := flag.String("store", "devices.json", "path of the JSON device store")
	tags := flag.String("tags", "", "tag filter, for example region:eu,!retired")
	flag.Parse()

	repo, err := repository.NewFileRepo(*store)
	if err != nil {
		log.Fatalf("open store: %v", err)
	}
	devices, err := repo.List(context.Background())
	if err != nil {
		log.Fatalf("list devices: %v", err)
	}
	for _, d := range devices {
		ok, err := tagfilter.Match(d.Tags, *tags)
		if err != nil {
			log.Fatal(err)
		}
		if ok {
			fmt.Println(d.ID)
		}
	}
}
