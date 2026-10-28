package report

import (
	"fmt"
	"io"
	"sort"
)

// Announce writes the catalog event for name to w, if the catalog knows the
// device.
func Announce(w io.Writer, catalog *Catalog, name string) {
	sink := NewSink(w)
	rep := NewReporter(sink, nil, nil)
	if d := catalog.Find(name); d != nil {
		rep.Record(d.Event())
	}
}

// Summarize writes one line per model to w — the model and how many devices
// the catalog lists for it — in model order.
func Summarize(w io.Writer, catalog *Catalog) {
	byModel := catalog.Models()
	models := make([]string, 0, len(byModel))
	for model := range byModel {
		models = append(models, model)
	}
	sort.Strings(models)
	for _, model := range models {
		_, _ = fmt.Fprintf(w, "%s: %d\n", model, len(byModel[model]))
	}
}
