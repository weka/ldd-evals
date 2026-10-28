---
# the node list has a type of its own: a class extending Node[] or owning a Node[] field
# (an access modifier keeps a props type's `readonly nodes: readonly Node[]` from counting)
type: regex
pattern: 'class \w+ extends Array<Node>|(private|protected|public) (readonly )?#?\w*[nN]odes: (readonly )?Node\[\]|(private|protected|public) (readonly )?\w*[nN]odes: ReadonlyArray<Node>'
match: contains
target: files
---
