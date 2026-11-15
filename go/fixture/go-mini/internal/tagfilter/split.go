package tagfilter

import "strings"

// splitTag reads "key:value", "key=value" or a bare "key". The key is
// compared without case; a value with a second separator is refused.
func splitTag(tag string) (key, value string, ok bool) {
	tag = strings.TrimSpace(tag)
	key = tag
	if sep := strings.IndexAny(tag, ":="); sep >= 0 {
		key, value = tag[:sep], strings.TrimSpace(tag[sep+1:])
	}
	key = strings.ToLower(strings.TrimSpace(key))
	if key == "" || strings.ContainsAny(value, ":=") {
		return "", "", false
	}
	return key, value, true
}
